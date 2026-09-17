(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const BAND=108;
  const START_Y=BAND/2;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const smooth=t=>t*t*(3-2*t);
  const lerp=(a,b,t)=>a+(b-a)*t;
  let frame=0;

  const workScanY=()=>Math.min(292,Math.max(250,window.innerHeight*.34));
  const introReadDistance=()=>Math.min(150,Math.max(120,window.innerHeight*.16));

  function ensureStack(){
    const magnifier=document.getElementById("mobileIntroMagnifier");
    if(!magnifier) return null;

    let stack=document.getElementById("mobileContinuousIntroStack");
    if(stack) return stack;

    // Keep the legacy mobileMagnifiedLine node in place because mobile-v2
    // still updates it internally. CSS hides that node; this continuous stack
    // is the visible optical layer.
    stack=document.createElement("div");
    stack.className="mobile-continuous-intro-stack";
    stack.id="mobileContinuousIntroStack";

    intro.forEach(([text])=>{
      const line=document.createElement("div");
      line.className="mobile-continuous-intro-line";
      line.textContent=text;
      stack.appendChild(line);
    });

    magnifier.appendChild(stack);
    return stack;
  }

  function applyClip(scanY){
    const scanWorld=document.getElementById("scanWorld");
    if(!scanWorld) return;
    const viewportH=window.innerHeight;
    const top=Math.max(0,scanY-BAND/2);
    const bottom=Math.max(0,viewportH-scanY-BAND/2);
    scanWorld.style.clipPath=`inset(${top}px 0px ${bottom}px 0px)`;
    document.documentElement.style.setProperty("--mobile-scan-y",`${scanY}px`);
    document.documentElement.style.setProperty("--mobile-scan-band",`${BAND}px`);
  }

  function renderContinuousIntro(){
    frame=0;
    const readDistance=introReadDistance();
    if(window.scrollY>readDistance) return;

    const scanWorld=document.getElementById("scanWorld");
    const scene=document.getElementById("scene");
    const stack=ensureStack();
    if(!scanWorld || !scene || !stack) return;

    const p=smooth(clamp(window.scrollY/readDistance,0,1));
    const scanY=lerp(START_Y,workScanY(),p);

    scanWorld.dataset.slug="intro";
    scanWorld.classList.add("intro-magnifier","show");
    scanWorld.style.background="#000";
    scene.classList.remove("mobile-scan-active");

    const decor=document.getElementById("mobileScanDecor");
    if(decor) decor.innerHTML="";

    const children=[...stack.children];
    if(!children.length) return;

    stack.style.transform="none";
    const first=children[0];
    const last=children[children.length-1];
    const firstCenter=first.offsetTop+first.offsetHeight/2;
    const lastCenter=last.offsetTop+last.offsetHeight/2;
    const sourceY=lerp(firstCenter,lastCenter,p);

    // The source coordinate and the physical scan coordinate are independent:
    // every intro line is guaranteed to pass through the window in order while
    // the scanner itself travels only from the top edge to its working position.
    const xShift=lerp(0,14,p);
    const yShift=scanY-sourceY;
    stack.style.transform=`translate3d(${xShift}px,${yShift}px,0)`;

    applyClip(scanY);
  }

  function schedule(){
    if(frame) return;
    frame=requestAnimationFrame(renderContinuousIntro);
  }

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  requestAnimationFrame(renderContinuousIntro);
})();
