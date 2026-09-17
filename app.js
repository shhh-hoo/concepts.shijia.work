function addText(cls, text, x, y, root=stage){
  const el=document.createElement("div");
  el.className=cls;
  el.textContent=text;
  el.style.left=`${x}px`;
  el.style.top=`${y}px`;
  root.appendChild(el);
  return el;
}

function addRule([x1,y1,x2,y2], root=stage){
  const dx=x2-x1;
  const dy=y2-y1;
  const len=Math.hypot(dx,dy);
  const angle=Math.atan2(dy,dx)*180/Math.PI;
  const el=document.createElement("div");
  el.className="rule";
  el.style.left=`${x1}px`;
  el.style.top=`${y1}px`;
  el.style.width=`${len}px`;
  el.style.transform=`rotate(${angle}deg)`;
  root.appendChild(el);
}

function buildFrontpage(root=stage){
  root.innerHTML="";
  visualRules.forEach(r=>addRule(r,root));
  intro.forEach(([t,x,y])=>addText("line",t,x,y,root));
  blocks.forEach(b=>b.lines.forEach(([t,x,y])=>addText("line",t,x,y,root)));
  indices.forEach(([t,x,y])=>addText("index",t,x,y,root));
}
buildFrontpage();

/* ---------------- GEOMETRY ---------------- */

function lineXAtY(line,y){
  const {x1,y1,x2,y2}=line;
  const t=(y-y1)/(y2-y1);
  return x1+(x2-x1)*t;
}
function boundaryXs(y){
  return boundaries.map(line=>lineXAtY(line,y));
}

function projectAt(x,y){
  const b=boundaryXs(y);
  if(x<b[0]) return null; // editorial intro region
  if(x<b[1]) return 0;
  if(x<b[2]) return 1;
  if(x<b[3]) return 2;
  if(x<b[4]) return 3;
  if(x<b[5]) return 4;
  return 5;
}

function setScanStyle(i){
  const p=projects[i];

  scanKicker.textContent=`${p.num} / ${p.label}`;
  scanTitle.textContent=p.title;
  scanStatement.textContent=p.statement;

  scanWorld.style.color="#000";
  scanTitle.style.color="#000";
  scanStatement.style.color="#000";
  scanKicker.style.color="#000";

  if(p.slug==="wss"){
    scanWorld.style.background="#050505";
    scanKicker.style.color="#ffffff";
    scanTitle.style.color="#ff20cf";
    scanStatement.style.color="#27c7ff";
  }else if(p.slug==="bnc"){
    scanWorld.style.background="linear-gradient(90deg,#f24b3f 0 33.33%,#315bff 33.33% 66.66%,#f2d84b 66.66% 100%)";
    scanKicker.style.color="#000";
    scanTitle.style.color="#000";
    scanStatement.style.color="#000";
  }else if(p.slug==="foundry"){
    scanWorld.style.background="#202020";
    scanKicker.style.color="#f3eee6";
    scanTitle.style.color="#ff5a1f";
    scanStatement.style.color="#f3eee6";
  }else if(p.slug==="cuelayer"){
    scanWorld.style.background="linear-gradient(90deg,#eef0c8 0 78%,#dbe1ea 78% 100%)";
    scanTitle.style.color="#111";
    scanStatement.style.color="#586579";
  }else if(p.slug==="aidrb"){
    scanWorld.style.background="linear-gradient(90deg,#f7f7f4 0 92%,#c9302c 92% 100%)";
    scanTitle.style.color="#111";
    scanStatement.style.color="#111";
  }else{
    scanWorld.style.background="linear-gradient(90deg,#d8c4e3 0%,#e8ccda 50%,#f3c99a 100%)";
    scanTitle.style.color="#252525";
    scanStatement.style.color="#353535";
  }
}

function heroShell(cls,kicker,title,statement,micro,fields=""){
  return `
    <section class="project-page project-hero ${cls}">
      <div class="project-kicker">${kicker}</div>
      <h1 class="project-title">${title}</h1>
      <p class="project-statement">${statement}</p>
      ${fields}
      ${micro ? `<div class="project-micro">${micro}</div>` : ""}
    </section>`;
}

function asset(tag,caption,cls=""){
  return `<div class="asset ${cls}"><span class="tag">${tag}</span><span class="caption">${caption}</span></div>`;
}

function renderProjectPage(i){
  WSSContent.destroy();
  const p=projects[i];
  let html="";

  if(p.slug==="wss"){
    html = WSSContent.render(p);
  }

  if(p.slug==="bnc"){
    html += `
      <section class="project-page project-hero world-bnc">
        <div class="project-kicker">02 / TEACHING METHODOLOGY</div>
        <h1 class="project-title">BLOCK<br>NET<br>CHAIN</h1>
        <p class="project-statement">${p.statement}</p>
        <div class="bnc-states">
          <div class="bnc-state bnc-block">BLOCK</div>
          <div class="bnc-state bnc-net">NET</div>
          <div class="bnc-state bnc-chain">CHAIN</div>
        </div>
      </section>
      <section class="project-page project-assets world-bnc-assets">
        <p class="asset-label">THE SAME KNOWLEDGE / THREE FORMS</p>
        <div class="bnc-grid">
          ${asset("01 / BLOCK","REAL TEACHING MATERIAL AS ISOLATED UNITS.")}
          ${asset("02 / NET","THE SAME CONTENT REORGANISED AS RELATIONSHIPS.")}
          ${asset("03 / CHAIN","THE SAME CONTENT AS A SEQUENCE OF REASONING.")}
        </div>
      </section>`;
  }

  if(p.slug==="foundry"){
    html += heroShell(
      "world-foundry","03 / AI LEARNING PLATFORM","FOUNDRY",p.statement,
      "GENERATION / GOVERNANCE / INFRASTRUCTURE",
      `<div class="color-field foundry-f1"></div><div class="color-field foundry-f2"></div><div class="color-field foundry-f3"></div>`
    );
    html += `
      <section class="project-page project-assets world-foundry-assets">
        <p class="asset-label">SYSTEM FIRST / UI SECOND</p>
        ${asset("01 / DOMINANT","EXPERT CURRICULUM → GENERATION → REVIEW / CONTROL → STUDENT PATH.","asset-main governance")}
        <div class="asset-row">
          ${asset("02 / CONCRETE EXAMPLE","ONE GENERATED LEARNING ASSET WITH THE CURRICULUM CONSTRAINTS THAT SHAPED IT.","prototype")}
          ${asset("03 / SUPPORTING UI","ONE PROTOTYPE SCREEN — EVIDENCE, NOT THE MAIN STORY.","prototype")}
        </div>
      </section>`;
  }

  if(p.slug==="cuelayer"){
    html += heroShell(
      "world-cuelayer","04 / LIVE AI LAYER","CUELAYER",p.statement,
      "SUBTLE ATTENTION / CONNECTION / TRANSFORMATION",
      `<div class="color-field cue-f1"></div><div class="color-field cue-f2"></div>`
    );
    html += `
      <section class="project-page project-assets world-cuelayer-assets">
        <p class="asset-label">LIVE PRODUCT / STATES / SYSTEM</p>
        ${asset("01 / DOMINANT PRODUCT VIEW","SCREEN RECORDING OR LARGE SCREENSHOT OF A LESSON WITH CUELAYER ACTUALLY SURFACING A CUE.","asset-main product")}
        <div class="asset-film">
          ${asset("STATE","QUIET")}
          ${asset("STATE","FOCUS")}
          ${asset("STATE","RELATE")}
          ${asset("STATE","TRANSFORM")}
        </div>
        ${asset("03 / SYSTEM","TEACHING REPRESENTATION / DISPLAY DECISION PIPELINE / SYSTEM DIAGRAM.","diagram")}
      </section>`;
  }

  if(p.slug==="aidrb"){
    html += heroShell(
      "world-aidrb","05 / TEACHING RESOURCE SYSTEM","AIDRB",p.statement,
      "BLACK / WHITE / RED INDEX",
      `<div class="color-field aid-f1"></div><div class="color-field aid-f2"></div><div class="color-field aid-f3"></div>`
    );
    html += `
      <section class="project-page project-assets world-aidrb-assets">
        <p class="asset-label">MATERIAL FIRST / SOFTWARE SECOND</p>
        ${asset("01 / DOMINANT","A LARGE LOOSE SPREAD OF REAL TEACHING MATERIAL: SLIDES, DIAGRAMS, REFERENCES, TOOLS, EXAMPLES.","asset-main spread")}
        <div class="asset-row equal">
          ${asset("02 / BEFORE","SOURCE MATERIAL / RAW RESOURCE / ORIGINAL CONTEXT.","before")}
          ${asset("03 / AFTER","CURATED / TRANSFORMED / TEACHER-READY OUTPUT.","after")}
        </div>
      </section>`;
  }

  if(p.slug==="9701"){
    html += `
      <section class="project-page project-hero world-9701">
        <div class="project-kicker">06 / CHEMISTRY LEARNING SYSTEM</div>
        <h1 class="project-title">9701</h1>
        <p class="project-statement">${p.statement}</p>
        <div class="gradient-set">
          <div class="gradient-panel gradient-home">HOME</div>
          <div class="gradient-panel gradient-as">AS</div>
          <div class="gradient-panel gradient-a2">A2</div>
          <div class="gradient-panel gradient-interactive">INTERACTIVE</div>
        </div>
        <div class="project-micro">HOME / AS / A2 / INTERACTIVE — FOUR PRODUCT GRADIENTS</div>
      </section>
      <section class="project-page project-assets world-9701 world-9701-assets">
        <p class="asset-label">WORLD → AS → A2 → INTERACTIVE</p>
        ${asset("01 / HOME","REACTION NETWORK — LARGE ENOUGH THAT ONLY PART OF THE WORLD FITS IN THE VIEWPORT.","asset-main network")}
        <div class="asset-row three">
          ${asset("02 / AS","AS CONTENT / MECHANISM OR CONCEPT VIEW.","as-asset")}
          ${asset("03 / A2","A2 CONTENT / PRACTICE / REACTION PATH.","a2-asset")}
          ${asset("04 / INTERACTIVE","INTERACTIVE PRACTICE / STUDENT SESSION / TRAINER.","interactive-asset")}
        </div>
      </section>`;
  }

  projectScroll.innerHTML=html;
  projectScroll.scrollTop=0;
  WSSContent.mount(p.slug === "wss", projectScroll);
}

function sheetPolygons(){
  const top=boundaries.map(line=>lineXAtY(line,0));
  const bottom=boundaries.map(line=>lineXAtY(line,1024));

  const polys=[];
  polys.push(`polygon(0px 0px, ${top[0]}px 0px, ${bottom[0]}px 1024px, 0px 1024px)`);

  for(let i=0;i<boundaries.length-1;i++){
    polys.push(
      `polygon(${top[i]}px 0px, ${top[i+1]}px 0px, ${bottom[i+1]}px 1024px, ${bottom[i]}px 1024px)`
    );
  }

  polys.push(
    `polygon(${top[top.length-1]}px 0px, 1536px 0px, 1536px 1024px, ${bottom[bottom.length-1]}px 1024px)`
  );
  return polys;
}

let active=null;
let scanY=512;
let state="index";
let sheets=[];

function scenePoint(e){
  const rect=scene.getBoundingClientRect();
  return {
    x:(e.clientX-rect.left)*(1536/rect.width),
    y:(e.clientY-rect.top)*(1024/rect.height)
  };
}

function moveScan(e){
  if(state!=="index") return;

  const {x,y}=scenePoint(e);
  const yy=Math.max(18,Math.min(1006,y));
  const i=projectAt(x,yy);

  if(i===null){
    active=null;
    scanWorld.classList.remove("show");
    return;
  }

  active=i;
  scanY=yy;
  setScanStyle(i);

  const band=82;
  scanWorld.style.clipPath=
    `inset(${Math.max(0,yy-band/2)}px 0px ${Math.max(0,1024-yy-band/2)}px 0px)`;
  scanWorld.classList.add("show");
}

function hideScan(){
  if(state!=="index") return;
  active=null;
  scanWorld.classList.remove("show");
}

function makeSheet(clip){
  const clone=stage.cloneNode(true);
  clone.removeAttribute("id");
  clone.classList.add("field-sheet");
  clone.style.setProperty("--clip",clip);
  clone.style.zIndex="40";
  scene.appendChild(clone);
  sheets.push(clone);
  return clone;
}

function openProject(){
  if(state!=="index" || active===null) return;

  state="opening";
  const selectedSheet=active+1; // sheet 0 is editorial intro
  renderProjectPage(active);
  projectWorld.classList.add("visible");

  sheets=sheetPolygons().map(makeSheet);

  requestAnimationFrame(()=>{
    stage.style.visibility="hidden";

    /*
      Preserve the previous interaction grammar:
      - one shared diagonal axis
      - sheets split around selected project
      - selected sheet follows scan position
      - distance-based stagger
      The axis is updated only to match the new Figma diagonal angle.
    */
    const axisX=700;
    const axisY=-1000;
    const baseLen=Math.hypot(axisX,axisY);
    const ux=axisX/baseLen;
    const uy=axisY/baseLen;
    // The WSS world fills the real viewport, even when the index is scaled down.
    // Keep the shared diagonal axis, but clear the viewport on tall phones.
    const outerTransform=getComputedStyle(scene).transform;
    const outerScale=outerTransform==="none" ? 1 : Math.abs(new DOMMatrixReadOnly(outerTransform).a);
    const viewportTravel=(window.innerHeight/2+scene.offsetHeight*outerScale/2+24)/(Math.abs(uy)*outerScale);
    const travel=projects[active].slug==="wss" ? Math.max(baseLen*1.48,viewportTravel) : baseLen*1.48;

    sheets.forEach((sheet,sheetIndex)=>{
      let sign;
      if(sheetIndex<selectedSheet) sign=-1;
      else if(sheetIndex>selectedSheet) sign=1;
      else sign=scanY<512 ? 1 : -1;

      sheet.style.setProperty("--dx",`${sign*ux*travel}px`);
      sheet.style.setProperty("--dy",`${sign*uy*travel}px`);

      const delay=Math.abs(sheetIndex-selectedSheet)*28;
      setTimeout(()=>sheet.classList.add("exit"),delay);
    });

    setTimeout(()=>scanWorld.classList.add("commit"),120);
  });

  setTimeout(()=>{
    state="opened";
    WSSContent.activate();
    scene.classList.add("opened");
    scanWorld.classList.remove("show");
  },1250);
}

function closeProject(){
  if(state!=="opened") return;

  state="closing";
  WSSContent.pause();
  scene.classList.remove("opened");
  scanWorld.classList.remove("commit");

  sheets.slice().reverse().forEach((sheet,i)=>{
    setTimeout(()=>sheet.classList.remove("exit"),i*18);
  });

  setTimeout(()=>{
    sheets.forEach(s=>s.remove());
    sheets=[];
    stage.style.visibility="visible";
    projectWorld.classList.remove("visible");
    projectScroll.scrollTop=0;
    scanWorld.classList.remove("show");
    active=null;
    state="index";
    WSSContent.destroy();
  },1180);
}

function fit(){
  const s=Math.min(
    window.innerWidth/1536,
    window.innerHeight/1024
  );
  scene.style.transform=`translate(-50%,-50%) scale(${s})`;
}

viewport.addEventListener("mousemove",moveScan);
viewport.addEventListener("mouseleave",hideScan);
viewport.addEventListener("click",e=>{
  if(e.target.closest("#backBtn")) return;
  if(state==="opened" && e.target.closest("#projectWorld")) return;
  openProject();
});
backBtn.addEventListener("click",e=>{
  e.stopPropagation();
  closeProject();
});
window.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeProject();
});
window.addEventListener("resize",fit);
fit();
