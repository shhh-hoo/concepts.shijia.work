(function(){
  const baseRenderProjectPage = renderProjectPage;

  const external = (href, label, className = "") =>
    `<a class="${className}" href="${href}" target="_blank" rel="noreferrer">${label}</a>`;

  function libraryRow(stage, part, title, tone, href){
    return `
      <a class="p9701-library-row p9701-library-row--${tone}" href="${href}" target="_blank" rel="noreferrer">
        <span class="p9701-library-stage">${stage}</span>
        <span class="p9701-library-part">${part}</span>
        <span class="p9701-library-title">${title}</span>
        <span class="p9701-library-arrow" aria-hidden="true">↗</span>
      </a>`;
  }

  function create9701Markup(){
    return `
      <section class="project-page p9701-page p9701-hero" aria-labelledby="p9701-title">
        <div class="p9701-frame" aria-hidden="true"></div>
        <p class="p9701-kicker">06 / CHEMISTRY LEARNING SYSTEM</p>
        ${external("https://9701.shijia.work/", "OPEN 9701 ↗", "p9701-open")}
        <h1 id="p9701-title" class="p9701-display">9701</h1>

        <div class="p9701-route-stack" aria-label="9701 product routes">
          ${external("https://9701.shijia.work/", `<span>HOME / ONE LIBRARY</span><strong>Choose a route.</strong>`, "p9701-route p9701-route--home")}
          ${external("https://9701.shijia.work/as/", `<span>AS / FOUNDATIONS</span><strong>Build the first map.</strong>`, "p9701-route p9701-route--as")}
          ${external("https://9701.shijia.work/a2/", `<span>A2 / EXTENSION</span><strong>Extend the network.</strong>`, "p9701-route p9701-route--a2")}
          ${external("https://9701.shijia.work/interactive/", `<span>INTERACTIVE / PRACTICE</span><strong>Rehearse the links.</strong>`, "p9701-route p9701-route--interactive")}
        </div>

        <p class="p9701-statement">A chemistry learning system of reactions, mechanisms and practice, built as a world of connected transformations.</p>
        <p class="p9701-micro">CAIE CHEMISTRY 9701 / RESOURCE BANK / INTERACTIVE CHEMISTRY</p>
      </section>

      <section class="project-page p9701-page p9701-library" aria-labelledby="p9701-library-title">
        <div class="p9701-section-head">
          <div>
            <p class="p9701-kicker">01 / STRUCTURE</p>
            <h2 id="p9701-library-title" class="p9701-section-title">One library.<br>Two stages.</h2>
          </div>
          <p class="p9701-section-copy">The site starts with route choice, then keeps the material in one filterable chemistry library rather than splitting revision into unrelated pages.</p>
        </div>

        <div class="p9701-stage-ribbon" aria-label="AS and A2 stage structure">
          <span class="p9701-stage-ribbon-as"><b>AS</b><em>FOUNDATIONS → ORGANIC</em></span>
          <span class="p9701-stage-ribbon-a2"><b>A2</b><em>PHYSICAL → ORGANIC</em></span>
        </div>

        <div class="p9701-library-index">
          ${libraryRow("AS+A2", "WHOLE BANK", "Equation Bank Overview", "cross", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-index")}
          ${libraryRow("AS", "FOUNDATIONS", "AS Foundations & Inorganic", "as", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-as-foundations-inorganic")}
          ${libraryRow("AS", "ORGANIC", "Hydrocarbons & Halogenoalkanes", "as", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-as-hydrocarbons-halogenoalkanes")}
          ${libraryRow("AS", "ORGANIC", "Alcohols & Carbonyls", "as", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-as-alcohols-carbonyls")}
          ${libraryRow("A2", "ORGANIC", "Arenes, Halogenoarenes & Phenol", "a2", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-a2-arenes-phenols")}
          ${libraryRow("A2", "PHYSICAL", "Physical Chemistry & Transition Elements", "a2", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-a2-physical-transition-elements")}
          ${libraryRow("A2", "ORGANIC", "Acyl Chemistry, Nitrogen, Amino Acids & Polymers", "a2", "https://9701.shijia.work/document.html?doc=chemistry%2F9701-equation-bank-a2-acyl-nitrogen-polymers")}
          ${libraryRow("A2", "COMPARISON", "Acidity Comparisons / Basicity Comparisons", "a2", "https://9701.shijia.work/#library-panel")}
        </div>

        <div class="p9701-library-foot">
          <p>Stage and Part create the structure. Topics & Skills narrow the concept focus without turning the homepage into a mixed document dump.</p>
          ${external("https://9701.shijia.work/#library-panel", "BROWSE THE REAL LIBRARY ↗", "p9701-inline-link")}
        </div>
      </section>

      <section class="project-page p9701-page p9701-paths" aria-labelledby="p9701-paths-title">
        <div class="p9701-route-bar" aria-hidden="true"></div>
        <div class="p9701-section-head p9701-section-head--paths">
          <div>
            <p class="p9701-kicker">02 / CONNECTION</p>
            <h2 id="p9701-paths-title" class="p9701-section-title">Reactions are<br>paths, not lists.</h2>
          </div>
          <p class="p9701-section-copy">The AS Organic Pathways tool turns functional-group conversions into a clickable map, with diagram and graph views plus reagent recall.</p>
        </div>

        <div class="p9701-path-shell">
          <div class="p9701-path-main">
            <div class="p9701-path-toolbar">
              <div><p class="p9701-kicker">ROUTE MAP</p><strong>Pick a node or conversion</strong></div>
              <div class="p9701-view-toggle" aria-hidden="true"><span>DIAGRAM</span><span>GRAPH MAP</span></div>
            </div>
            <div class="p9701-route-grid" aria-label="Simplified AS organic pathway preview">
              <span class="p9701-route-node r-alkenes">ALKENES</span><span class="p9701-route-arrow r-a1">→</span><span class="p9701-route-node r-halo">HALOGENOALKANES</span><span class="p9701-route-arrow r-a2">→</span><span class="p9701-route-node r-nitriles">NITRILES</span><span class="p9701-route-arrow r-a3">→</span><span class="p9701-route-node r-amines">AMINES</span>
              <span class="p9701-route-arrow r-down1">↓</span><span class="p9701-route-arrow r-down2">↓</span><span class="p9701-route-arrow r-down3">↓</span>
              <span class="p9701-route-node r-alcohols">ALCOHOLS</span><span class="p9701-route-arrow r-a4">↔</span><span class="p9701-route-node r-carbonyl">CARBONYL COMPOUNDS</span><span class="p9701-route-arrow r-a5">→</span><span class="p9701-route-node r-acid">CARBOXYLIC ACIDS</span>
              <span class="p9701-route-arrow r-down4">↘</span><span class="p9701-route-arrow r-down5">↙</span><span class="p9701-route-node r-esters">ESTERS</span>
            </div>
          </div>
          <aside class="p9701-path-side">
            <span class="p9701-side-label">SELECTED NODE</span>
            <h3>Alcohols</h3>
            <div class="p9701-route-list">
              <div><span>INCOMING</span><strong>Trace the route used to form the functional group.</strong></div>
              <div><span>OUTGOING</span><strong>Compare the conversions available from the same node.</strong></div>
              <div><span>VIEW</span><strong>Diagram memory or direct graph relationships.</strong></div>
            </div>
            <div class="p9701-recall"><span>QUICK RECALL</span><strong>Reagent → condition → product</strong></div>
          </aside>
        </div>
        ${external("https://9701.shijia.work/interactive/9701-as-organic-paths/", "OPEN ORGANIC PATHWAYS ↗", "p9701-tool-link")}
      </section>

      <section class="project-page p9701-page p9701-memory" aria-labelledby="p9701-memory-title">
        <div class="p9701-section-head p9701-section-head--memory">
          <div>
            <p class="p9701-kicker">03 / PRACTICE</p>
            <h2 id="p9701-memory-title" class="p9701-section-title">One prompt.<br>One answer.<br>One next step.</h2>
          </div>
          <p class="p9701-section-copy">The Memorisation Bank narrows a revision session by stage, level, topic and training file, then checks one blank at a time and sends misses into review.</p>
        </div>

        <div class="p9701-memory-shell">
          <div class="p9701-memory-main">
            <div class="p9701-badges"><span>CAIE 9701</span><span>AS + A2</span><span>TOPIC</span><span>TRAINING FILE</span></div>
            <p class="p9701-question-label">CURRENT SET / FOCUSED DRILL FLOW</p>
            <h3>Refine the set, then stay inside the session.</h3>
            <p class="p9701-question-copy">The product keeps setup separate from practice: choose the scope, select a learning mode, answer, check, reveal only when needed, then move on.</p>
            <div class="p9701-mode-strip">
              <div class="is-active"><strong>Full Dictation</strong><small>Type the canonical answer</small></div>
              <div><strong>Easy Mode</strong><small>Key words, then visible copy</small></div>
              <div><strong>Flashcard Mode</strong><small>Current set, no typing</small></div>
            </div>
            <div class="p9701-answer-surface">ANSWER SURFACE</div>
            <div class="p9701-actions"><span>Previous</span><span class="is-primary">Check</span><span>Reveal</span><span>Next</span></div>
          </div>
          <aside class="p9701-memory-side">
            <p class="p9701-kicker">SESSION SUPPORT</p>
            <h4>Keep the next prompts nearby.</h4>
            <div class="p9701-stat"><span>SOURCE ITEMS</span><strong>Current file</strong></div>
            <div class="p9701-stat"><span>SESSION QUESTIONS</span><strong>Scoped set</strong></div>
            <div class="p9701-stat"><span>SESSION BLANKS</span><strong>One by one</strong></div>
            <div class="p9701-queue"><span>REVIEW QUEUE</span><strong>Missed / revealed</strong><p>What breaks during recall becomes the next pass instead of disappearing into a score.</p></div>
          </aside>
        </div>
        ${external("https://9701.shijia.work/interactive/9701-memorisation-bank/", "OPEN MEMORISATION BANK ↗", "p9701-tool-link p9701-tool-link--memory")}
      </section>

      <section class="project-page p9701-page p9701-close" aria-labelledby="p9701-close-title">
        <div class="p9701-frame" aria-hidden="true"></div>
        <p class="p9701-kicker">9701.SHIJIA.WORK</p>
        <h2 id="p9701-close-title" class="p9701-section-title">Open the system.</h2>
        <p>AS, A2, documents, reaction pathways and memorisation live in the same student-facing chemistry environment.</p>
        ${external("https://9701.shijia.work/", "VISIT 9701.SHIJIA.WORK ↗", "p9701-final-link")}
      </section>`;
  }

  renderProjectPage = function(i){
    const project = projects[i];
    if(!project || project.slug !== "9701"){
      projectScroll.classList.remove("project-scroll--9701");
      return baseRenderProjectPage(i);
    }

    projectScroll.classList.add("project-scroll--9701");
    projectScroll.innerHTML = create9701Markup();
    projectScroll.scrollTop = 0;
  };
})();
