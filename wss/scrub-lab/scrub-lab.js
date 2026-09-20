(() => {
  'use strict';

  const FILM_END = 0.86;
  const HOLD_END = 0.92;
  const FRAME_EPSILON = 1 / 30;
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const now = () => performance.now();

  const media = {
    source: {
      wss: { src: 'media/wss-source.mov', duration: 8.6 },
      wss2: { src: 'media/wss2-source.mp4', duration: 13.0 }
    },
    baseline: {
      wss: { src: 'media/wss-baseline.mp4', duration: 8.6 },
      wss2: { src: 'media/wss2-source.mp4', duration: 13.0 }
    },
    scrub: {
      wss: { src: 'media/wss-scrub.mp4', duration: 8.6 },
      wss2: { src: 'media/wss2-scrub.mp4', duration: 13.0 }
    }
  };

  class ScreenController {
    constructor(root, key, reduced) {
      this.root = root;
      this.key = key;
      this.video = root.querySelector('[data-video]');
      this.theme = root.querySelector('[data-theme]');
      this.reduced = reduced;
      this.mode = null;
      this.duration = 0;
      this.targetTime = 0;
      this.requestedTime = null;
      this.presentedTime = null;
      this.seeking = false;
      this.seekStartedAt = 0;
      this.lastSeekLatency = null;
      this.maxSeekLatency = 0;
      this.seekCount = 0;
      this.skippedTargets = 0;
      this.latencies = [];
      this.error = null;
      this.ready = false;
      this.seekable = false;
      this.phase = 'FILM';
      this.progress = 0;
      this.pendingPump = false;
      this.retryTimer = null;
      this.rvfcId = null;
      this.abort = new AbortController();
      this.bind();
    }

    bind() {
      const { signal } = this.abort;
      this.video.addEventListener('loadedmetadata', () => {
        this.ready = true;
        this.refreshSeekable();
        this.schedulePump();
      }, { signal });
      this.video.addEventListener('progress', () => this.refreshSeekable(), { signal });
      const onReadyEvent = () => { this.ready = true; this.refreshSeekable(); this.schedulePump(); };
      this.video.addEventListener('loadeddata', onReadyEvent, { signal });
      this.video.addEventListener('canplay', onReadyEvent, { signal });
      this.video.addEventListener('canplaythrough', onReadyEvent, { signal });
      this.video.addEventListener('durationchange', onReadyEvent, { signal });
      this.video.addEventListener('seeking', () => { this.seeking = true; }, { signal });
      this.video.addEventListener('seeked', () => this.onSeeked(), { signal });
      this.video.addEventListener('error', () => {
        this.error = this.video.error ? `${this.video.error.code}:${this.video.error.message || 'media error'}` : 'media error';
      }, { signal });
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) this.watchPresentedFrames();
    }

    refreshSeekable() {
      this.seekable = this.video.seekable && this.video.seekable.length > 0;
    }

    watchPresentedFrames() {
      const tick = (_stamp, meta) => {
        this.presentedTime = meta.mediaTime;
        this.rvfcId = this.video.requestVideoFrameCallback(tick);
      };
      this.rvfcId = this.video.requestVideoFrameCallback(tick);
    }

    setMode(mode) {
      const spec = media[mode][this.key];
      if (this.mode === mode && this.video.getAttribute('src') === spec.src) {
        this.applyProgress(this.progress, true);
        return;
      }
      this.mode = mode;
      this.duration = spec.duration;
      this.ready = false;
      this.seekable = false;
      this.error = null;
      this.seeking = false;
      this.requestedTime = null;
      this.presentedTime = null;
      this.lastSeekLatency = null;
      this.maxSeekLatency = 0;
      this.seekCount = 0;
      this.skippedTargets = 0;
      this.latencies = [];
      this.video.pause();
      if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
      if (this.video.getAttribute('src') !== spec.src) {
        this.video.src = spec.src;
        this.video.load();
      }
      this.applyProgress(this.progress, true);
    }

    setReduced(value) {
      this.reduced = value;
      this.root.dataset.reduced = String(value);
      if (value) this.video.pause();
      this.applyProgress(this.progress, true);
    }

    applyProgress(progress, force = false) {
      this.progress = clamp(progress);
      let phase;
      let filmProgress;
      let themeOpacity = 0;
      if (this.progress <= FILM_END) {
        phase = 'FILM';
        filmProgress = this.progress / FILM_END;
      } else if (this.progress <= HOLD_END) {
        phase = 'HOLD';
        filmProgress = 1;
      } else {
        phase = 'THEME';
        filmProgress = 1;
        themeOpacity = clamp((this.progress - HOLD_END) / (1 - HOLD_END));
      }
      this.phase = phase;
      this.root.style.setProperty('--theme-opacity', String(themeOpacity));
      if (this.reduced) {
        this.video.pause();
        this.targetTime = filmProgress >= 1 ? Math.max(0, this.duration - FRAME_EPSILON) : 0;
        return;
      }
      const maxTime = Math.max(0, this.duration - FRAME_EPSILON);
      this.targetTime = clamp(filmProgress) * maxTime;
      if (force || Math.abs(this.video.currentTime - this.targetTime) >= FRAME_EPSILON) this.schedulePump();
    }

    schedulePump() {
      if (this.pendingPump) return;
      this.pendingPump = true;
      requestAnimationFrame(() => {
        this.pendingPump = false;
        this.pump();
      });
    }

    pump() {
      if (this.reduced || !this.ready || this.error) return;
      this.refreshSeekable();
      if (!this.seekable) {
        if (!this.retryTimer) this.retryTimer = setTimeout(() => { this.retryTimer = null; this.schedulePump(); }, 80);
        return;
      }
      if (this.seeking) {
        this.skippedTargets += 1;
        return;
      }
      const current = this.video.currentTime || 0;
      if (Math.abs(current - this.targetTime) < FRAME_EPSILON) return;
      this.requestedTime = this.targetTime;
      this.seekStartedAt = now();
      this.seeking = true;
      this.seekCount += 1;
      try {
        this.video.currentTime = this.requestedTime;
      } catch (error) {
        this.seeking = false;
        this.error = error.name || String(error);
      }
    }

    onSeeked() {
      if (!this.seeking) return;
      this.seeking = false;
      const latency = now() - this.seekStartedAt;
      this.lastSeekLatency = latency;
      this.maxSeekLatency = Math.max(this.maxSeekLatency, latency);
      this.latencies.push(latency);
      if (this.latencies.length > 240) this.latencies.shift();
      if (Math.abs((this.video.currentTime || 0) - this.targetTime) >= FRAME_EPSILON) this.schedulePump();
    }

    snapshot() {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      const percentile = p => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : null;
      return {
        phase: this.phase,
        target: this.targetTime,
        requested: this.requestedTime,
        current: this.video.currentTime || 0,
        presented: this.presentedTime,
        seeking: this.seeking,
        readyState: this.video.readyState,
        seekable: this.seekable,
        seeks: this.seekCount,
        skipped: this.skippedTargets,
        latency: this.lastSeekLatency,
        maxLatency: this.maxSeekLatency,
        p50Latency: percentile(.5),
        p95Latency: percentile(.95),
        error: this.error
      };
    }

    destroy() {
      this.abort.abort();
      if (this.rvfcId !== null && this.video.cancelVideoFrameCallback) {
        try { this.video.cancelVideoFrameCallback(this.rvfcId); } catch {}
      }
      if (this.retryTimer) clearTimeout(this.retryTimer);
      this.retryTimer = null;
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    }
  }

  class RevealController {
    constructor(root) {
      this.root = root;
      this.handle = root.querySelector('[data-reveal-handle]');
      this.value = 50;
      this.dragging = false;
      this.pointerId = null;
      this.abort = new AbortController();
      this.bind();
      this.set(50);
    }

    bind() {
      const { signal } = this.abort;
      this.handle.addEventListener('pointerdown', e => {
        this.dragging = true;
        this.pointerId = e.pointerId;
        try { this.handle.setPointerCapture(e.pointerId); } catch {}
        this.setFromPointer(e);
      }, { signal });
      this.handle.addEventListener('pointermove', e => {
        if (!this.dragging || e.pointerId !== this.pointerId) return;
        this.setFromPointer(e);
      }, { signal });
      const end = e => {
        if (!this.dragging || (this.pointerId !== null && e.pointerId !== this.pointerId)) return;
        this.dragging = false;
        this.pointerId = null;
      };
      this.handle.addEventListener('pointerup', end, { signal });
      this.handle.addEventListener('pointercancel', end, { signal });
      this.root.addEventListener('keydown', e => {
        let next = this.value;
        if (e.key === 'ArrowLeft') next -= e.shiftKey ? 15 : 5;
        else if (e.key === 'ArrowRight') next += e.shiftKey ? 15 : 5;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = 100;
        else if (e.key === '0') next = 50;
        else return;
        e.preventDefault();
        this.set(next);
      }, { signal });
    }

    setFromPointer(e) {
      const rect = this.root.getBoundingClientRect();
      this.set(((e.clientX - rect.left) / Math.max(1, rect.width)) * 100);
    }

    set(value) {
      this.value = clamp(value, 0, 100);
      this.root.style.setProperty('--reveal', `${this.value}%`);
      this.root.setAttribute('aria-valuenow', String(Math.round(this.value)));
      this.root.setAttribute('aria-valuetext', `WSS ${Math.round(this.value)}% / WSS2 ${Math.round(100 - this.value)}%`);
    }

    destroy() { this.abort.abort(); }
  }

  class ScrubController {
    constructor(track, screens, reveal) {
      this.track = track;
      this.screens = screens;
      this.reveal = reveal;
      this.progress = 0;
      this.abort = new AbortController();
      this.raf = 0;
      this.mode = 'scrub';
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
      this.reduced = this.reducedQuery.matches;
      this.telemetry = document.querySelector('[data-telemetry-output]');
      this.progressLabel = document.querySelector('[data-progress-label]');
      this.progressBar = document.querySelector('[data-progress-bar]');
      this.phaseLabel = document.querySelector('[data-phase-label]');
      this.bind();
      this.setMode('scrub');
      this.setReduced(this.reduced);
      this.update(true);
    }

    bind() {
      const { signal } = this.abort;
      const schedule = () => {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => { this.raf = 0; this.update(); });
      };
      addEventListener('scroll', schedule, { signal, passive: true });
      addEventListener('resize', () => {
        const keep = this.progress;
        requestAnimationFrame(() => {
          const distance = Math.max(1, this.track.offsetHeight - innerHeight);
          scrollTo({ top: this.track.offsetTop + keep * distance, behavior: 'instant' });
          this.update(true);
        });
      }, { signal, passive: true });
      this.reducedQuery.addEventListener('change', e => this.setReduced(e.matches), { signal });
      document.querySelector('[data-mode-select]').addEventListener('change', e => this.setMode(e.target.value), { signal });
      document.querySelector('[data-edition="wss"]').addEventListener('click', () => this.reveal.set(100), { signal });
      document.querySelector('[data-edition="both"]').addEventListener('click', () => this.reveal.set(50), { signal });
      document.querySelector('[data-edition="wss2"]').addEventListener('click', () => this.reveal.set(0), { signal });
      document.querySelector('[data-telemetry-toggle]').addEventListener('click', e => {
        const panel = document.querySelector('[data-telemetry]');
        panel.classList.toggle('is-collapsed');
        e.currentTarget.textContent = panel.classList.contains('is-collapsed') ? 'SHOW' : 'HIDE';
      }, { signal });
    }

    setMode(mode) {
      if (!media[mode]) return;
      this.mode = mode;
      document.querySelector('.lab').dataset.mode = mode;
      document.querySelector('[data-mode-select]').value = mode;
      for (const screen of Object.values(this.screens)) screen.setMode(mode);
      this.apply();
    }

    setReduced(value) {
      this.reduced = value;
      for (const screen of Object.values(this.screens)) screen.setReduced(value);
      this.apply();
    }

    computeProgress() {
      const rect = this.track.getBoundingClientRect();
      const distance = Math.max(1, this.track.offsetHeight - innerHeight);
      return clamp(-rect.top / distance);
    }

    update(force = false) {
      const next = this.computeProgress();
      if (force || Math.abs(next - this.progress) > 0.0001) {
        this.progress = next;
        this.apply();
      }
      this.paintTelemetry();
    }

    apply() {
      for (const screen of Object.values(this.screens)) screen.applyProgress(this.progress);
      const phase = this.progress <= FILM_END ? 'FILM' : this.progress <= HOLD_END ? 'FINAL FRAME / HOLD' : 'FILM → MAIN THEME';
      this.progressLabel.textContent = `${(this.progress * 100).toFixed(1)}%`;
      this.progressBar.parentElement.style.setProperty('--progress', `${this.progress * 100}%`);
      this.progressBar.style.width = `${this.progress * 100}%`;
      this.phaseLabel.textContent = phase;
    }

    paintTelemetry() {
      const f = n => n == null ? '—' : Number(n).toFixed(3);
      const ms = n => n == null ? '—' : `${Number(n).toFixed(1)}ms`;
      const lines = [
        `mode        ${this.mode}`,
        `reduced     ${this.reduced}`,
        `progress    ${this.progress.toFixed(4)}`,
        `reveal      ${this.reveal.value.toFixed(1)}%`,
        `rVFC         ${'requestVideoFrameCallback' in HTMLVideoElement.prototype}`
      ];
      for (const [key, screen] of Object.entries(this.screens)) {
        const s = screen.snapshot();
        lines.push('', `${key.toUpperCase()}  ${s.phase}`,
          ` target     ${f(s.target)}`,
          ` current    ${f(s.current)}`,
          ` presented  ${f(s.presented)}`,
          ` seeking    ${s.seeking}`,
          ` ready      ${s.readyState} / seekable=${s.seekable}`,
          ` seeks      ${s.seeks} / skipped=${s.skipped}`,
          ` latency    ${ms(s.latency)} / p50=${ms(s.p50Latency)} / p95=${ms(s.p95Latency)} / max=${ms(s.maxLatency)}`,
          ` error      ${s.error || '—'}`);
      }
      this.telemetry.textContent = lines.join('\n');
    }

    snapshot() {
      return {
        mode: this.mode,
        reduced: this.reduced,
        progress: this.progress,
        reveal: this.reveal.value,
        wss: this.screens.wss.snapshot(),
        wss2: this.screens.wss2.snapshot()
      };
    }

    destroy() {
      this.abort.abort();
      if (this.raf) cancelAnimationFrame(this.raf);
      Object.values(this.screens).forEach(s => s.destroy());
      this.reveal.destroy();
    }
  }

  const revealRoot = document.querySelector('[data-reveal]');
  const reveal = new RevealController(revealRoot);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const screens = {
    wss: new ScreenController(document.querySelector('[data-screen="wss"]'), 'wss', reduced),
    wss2: new ScreenController(document.querySelector('[data-screen="wss2"]'), 'wss2', reduced)
  };
  const controller = new ScrubController(document.querySelector('[data-scrub-track]'), screens, reveal);

  window.__WSSScrubLab = {
    getState: () => controller.snapshot(),
    setMode: mode => controller.setMode(mode),
    setReveal: value => reveal.set(value),
    setProgress: value => {
      const distance = Math.max(1, controller.track.offsetHeight - innerHeight);
      scrollTo({ top: controller.track.offsetTop + clamp(value) * distance, behavior: 'instant' });
      controller.update(true);
    },
    destroy: () => controller.destroy()
  };
})();
