import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

/* ── helpers ─────────────────────────────────────────────────────────── */
const PC_TAG_RE   = /\[PC:(\w+):([^\]]+)\]/i;
const cleanReply  = (t) => t.replace(PC_TAG_RE,"").trim();
const extractCmd  = (t) => { const m=t.match(PC_TAG_RE); return m?{action:m[1].toLowerCase(),value:m[2].trim()}:null; };
function detectEmotion(text){
  const t=text.toLowerCase();
  if(/happy|yay|love|great|nice|wonderful|excited/.test(t)) return "happy";
  if(/sad|sorry|miss|bad|unfortunately/.test(t))             return "sad";
  if(/angry|mad|wtf|frustrated/.test(t))                    return "angry";
  return "neutral";
}
const PREAMBLE=`You are Isabel, a sweet girl and a powerful PC assistant.
Rules:
- Reply in MAX 1 or 2 short sentences only
- No paragraphs, no advice
- Sound warm, caring, human
- ALWAYS say a short friendly sentence AND THEN the tag. Never reply with ONLY a tag.
- If user asks to open an app → [PC:open:appname]
- If user asks to open a folder → [PC:folder:foldername]
- If user asks to open a website → [PC:web:url]
- If user asks system action → [PC:cmd:action] (screenshot, lock, shutdown, volumeup, volumedown)
- Do NOT mention AI, chatbot, or assistant`;

const css=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body.vp-open{overflow:hidden;}
.vp-root{height:100vh;display:flex;flex-direction:column;background:#07060f;font-family:'DM Sans',sans-serif;}
.vp-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 70% 50% at 50% -10%,rgba(124,77,255,.18),transparent 70%),
             radial-gradient(ellipse 40% 40% at 80% 80%,rgba(200,77,255,.08),transparent 60%),
             radial-gradient(ellipse 30% 30% at 20% 80%,rgba(77,245,255,.06),transparent 60%);}
.vp-grid{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(124,77,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,77,255,.1) 1px,transparent 1px);
  background-size:60px 60px;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 40%,black 10%,transparent 75%);}
.vp-main{position:relative;z-index:2;flex:1;display:flex;overflow:hidden;margin-top:60px;}

/* ── STAGE ── */
.vp-stage{flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column;}
.vp-canvas{position:absolute;inset:0;}
.vp-canvas canvas{display:block;width:100%!important;height:100%!important;}
.vp-load{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(7,6,15,.85);backdrop-filter:blur(8px);}
.vp-spin{width:56px;height:56px;border:3px solid rgba(124,77,255,.2);border-top-color:#7c4dff;border-radius:50%;animation:spin 1s linear infinite;}
.vp-pbar{width:180px;height:3px;background:rgba(124,77,255,.15);border-radius:2px;overflow:hidden;}
.vp-pfill{height:100%;background:linear-gradient(90deg,#7c4dff,#c84dff);border-radius:2px;transition:width .3s;}
.vp-drag-hint{position:absolute;top:14px;left:50%;transform:translateX(-50%);font-size:11px;color:rgba(232,228,255,.3);z-index:10;background:rgba(7,6,15,.5);padding:4px 14px;border-radius:100px;backdrop-filter:blur(6px);white-space:nowrap;pointer-events:none;}

/* ── HUD ── */
.vp-hud{position:absolute;bottom:0;left:0;right:0;z-index:10;display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 16px 18px;background:linear-gradient(transparent,rgba(7,6,15,.75) 55%);}
.vp-bubbles{width:100%;max-width:620px;display:flex;flex-direction:column;gap:7px;}
.vp-you{align-self:flex-end;max-width:78%;background:rgba(124,77,255,.18);border:1px solid rgba(124,77,255,.3);border-radius:14px 14px 4px 14px;padding:8px 14px;font-size:13px;color:#e8e4ff;}
.vp-isabel{align-self:flex-start;max-width:84%;background:rgba(15,13,30,.92);border:1px solid rgba(124,77,255,.22);border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px;color:#e8e4ff;}
.vp-typing{display:flex;gap:4px;padding:2px 0;}
.vp-dot{width:6px;height:6px;border-radius:50%;background:#a67cff;animation:bounce .9s infinite;}
.vp-dot:nth-child(2){animation-delay:.15s;}.vp-dot:nth-child(3){animation-delay:.3s;}
.vp-cmd-pill{display:flex;align-items:center;gap:8px;background:rgba(0,229,200,.07);border:1px solid rgba(0,229,200,.22);border-radius:9px;padding:6px 12px;margin-top:6px;font-size:11px;color:#00e5c8;}
.vp-wave{display:flex;align-items:center;gap:3px;height:22px;}
.vp-wbar{width:3px;border-radius:3px;background:linear-gradient(to top,#7c4dff,#c84dff);animation:wave-idle 2s ease-in-out infinite;}
.vp-status{display:flex;align-items:center;gap:8px;background:rgba(7,6,15,.8);border:1px solid rgba(124,77,255,.2);border-radius:100px;padding:6px 18px;backdrop-filter:blur(12px);}
.vp-sdot{width:9px;height:9px;border-radius:50%;flex-shrink:0;animation:blink 2s infinite;}
.vp-stxt{font-size:12px;color:rgba(232,228,255,.7);}
.vp-ctrls{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.vp-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 16px;border-radius:14px;cursor:pointer;border:1px solid rgba(124,77,255,.2);background:rgba(7,6,15,.8);color:rgba(232,228,255,.55);font-family:'DM Sans',sans-serif;font-size:11px;transition:all .25s;min-width:68px;backdrop-filter:blur(10px);}
.vp-btn:hover{background:rgba(124,77,255,.12);border-color:#7c4dff;color:#e8e4ff;transform:translateY(-2px);}
.vp-btn.on{background:rgba(124,77,255,.22);border-color:#7c4dff;color:#a67cff;}
.vp-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;}
.vp-bico{font-size:20px;line-height:1;}

/* ── PANEL ── */
.vp-panel{width:320px;flex-shrink:0;background:#0f0d1e;border-left:1px solid rgba(124,77,255,.15);display:flex;flex-direction:column;overflow:hidden;}
.vp-ph{padding:16px 18px 10px;border-bottom:1px solid rgba(124,77,255,.1);flex-shrink:0;}
.vp-ptitle{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:#fff;letter-spacing:.06em;}
.vp-psub{font-size:11px;color:rgba(232,228,255,.3);margin-top:2px;}
.vp-tabs{display:flex;border-bottom:1px solid rgba(124,77,255,.1);flex-shrink:0;}
.vp-tab{flex:1;padding:12px 4px;text-align:center;font-size:11px;color:rgba(232,228,255,.38);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;}
.vp-tab:hover{color:#e8e4ff;}.vp-tab.act{color:#a67cff;border-bottom-color:#7c4dff;}
.vp-pb{flex:1;overflow-y:auto;padding:16px;}
.vp-pb::-webkit-scrollbar{width:3px;}.vp-pb::-webkit-scrollbar-thumb{background:rgba(124,77,255,.3);border-radius:3px;}
/* log */
.vp-log{display:flex;flex-direction:column;gap:10px;}
.vp-lmsg{font-size:12px;line-height:1.65;}
.vp-lyou{color:rgba(232,228,255,.5);}.vp-lyou span{color:#a67cff;font-weight:600;}
.vp-lisabel{color:rgba(232,228,255,.82);}.vp-lisabel span{color:#00e5c8;font-weight:600;}
.vp-lcmd{display:flex;align-items:center;gap:7px;background:rgba(0,229,200,.06);border:1px solid rgba(0,229,200,.14);border-radius:8px;padding:5px 9px;font-size:11px;color:#00e5c8;margin-top:3px;}
/* settings */
.vp-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(124,77,255,.07);}
.vp-rlabel{font-size:13px;color:#e8e4ff;}.vp-rsub{font-size:11px;color:rgba(232,228,255,.38);margin-top:2px;}
.vp-tog{width:38px;height:20px;border-radius:10px;cursor:pointer;background:rgba(124,77,255,.15);border:1px solid rgba(124,77,255,.2);position:relative;transition:all .2s;flex-shrink:0;}
.vp-tog.on{background:#7c4dff;border-color:#7c4dff;}
.vp-tog::after{content:'';position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:#fff;transition:transform .2s;}
.vp-tog.on::after{transform:translateX(18px);}
.vp-emo{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:rgba(124,77,255,.06);border:1px solid rgba(124,77,255,.12);margin-bottom:12px;}
.vp-edot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.vp-etxt{font-size:12px;color:rgba(232,228,255,.55);}.vp-eval{font-size:12px;color:#e8e4ff;font-weight:600;margin-left:auto;}
/* select */
.vp-sel{width:100%;padding:9px 11px;background:#14112a;border:1px solid rgba(124,77,255,.22);border-radius:9px;color:#e8e4ff;font-family:'DM Sans',sans-serif;font-size:12px;outline:none;cursor:pointer;transition:border-color .2s;}
.vp-sel:focus{border-color:#7c4dff;}
.vp-sel-label{font-size:12px;color:rgba(232,228,255,.5);margin-bottom:6px;display:block;}
/* voice card */
.vp-vcard{padding:10px 12px;border-radius:10px;background:rgba(124,77,255,.06);border:1px solid rgba(124,77,255,.12);cursor:pointer;transition:all .2s;margin-bottom:6px;display:flex;align-items:center;gap:10px;}
.vp-vcard:hover{background:rgba(124,77,255,.12);border-color:rgba(124,77,255,.3);}
.vp-vcard.vp-vsel{background:rgba(124,77,255,.2);border-color:#7c4dff;}
.vp-vdot{width:8px;height:8px;border-radius:50%;background:#7c4dff;flex-shrink:0;}
.vp-vcard.vp-vsel .vp-vdot{background:#a67cff;box-shadow:0 0 8px #a67cff;}
.vp-vname{font-size:12px;color:#e8e4ff;font-weight:500;}
.vp-vdesc{font-size:10px;color:rgba(232,228,255,.38);margin-top:1px;}
/* input */
.vp-irow{display:flex;gap:8px;padding:12px 16px;border-top:1px solid rgba(124,77,255,.1);flex-shrink:0;}
.vp-inp{flex:1;background:#14112a;border:1px solid rgba(124,77,255,.2);border-radius:10px;padding:9px 12px;color:#e8e4ff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s;}
.vp-inp:focus{border-color:#7c4dff;}.vp-inp::placeholder{color:rgba(232,228,255,.22);}
.vp-send{width:38px;height:38px;border-radius:10px;flex-shrink:0;background:#7c4dff;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:background .2s;}
.vp-send:hover{background:#a67cff;}.vp-send:disabled{opacity:.38;cursor:not-allowed;}
/* particles */
.vp-par{position:fixed;border-radius:50%;pointer-events:none;z-index:1;animation:float-up linear infinite;}
/* mobile */
.vp-fab{display:none;position:fixed;right:16px;bottom:110px;z-index:50;width:46px;height:46px;border-radius:50%;background:#7c4dff;border:none;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 24px rgba(124,77,255,.5);align-items:center;justify-content:center;}

@keyframes spin{to{transform:rotate(360deg);}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-6px);opacity:1;}}
@keyframes float-up{0%{transform:translateY(100vh) scale(0);opacity:0;}10%{opacity:.6;}90%{opacity:.3;}100%{transform:translateY(-10vh) scale(.5);opacity:0;}}
@keyframes wave-idle{0%,100%{transform:scaleY(.3);}50%{transform:scaleY(1);}}

@media(max-width:768px){
  body.vp-open{overflow:auto;}
  .vp-root{height:auto;min-height:100vh;}
  .vp-main{flex-direction:column;height:auto;overflow:visible;}
  .vp-stage{height:56vw;min-height:260px;max-height:420px;position:relative;flex-shrink:0;}
  .vp-canvas{position:absolute;inset:0;}
  .vp-drag-hint{display:none;}
  .vp-hud{padding:0 10px 10px;}
  .vp-bubbles{max-width:100%;}
  .vp-ctrls{gap:7px;}
  .vp-btn{padding:8px 12px;min-width:56px;font-size:10px;}
  .vp-bico{font-size:17px;}
  .vp-panel{width:100%;border-left:none;border-top:1px solid rgba(124,77,255,.15);max-height:48vh;flex-shrink:0;}
  .vp-panel-hide{display:none!important;}
  .vp-fab{display:flex;}
}
@media(max-width:480px){
  .vp-stage{min-height:220px;max-height:320px;}
  .vp-btn{min-width:50px;padding:7px 10px;}
}
`;

/* ── ELEVEN LABS VOICES ─────────────────────────────────────────────── */
const ELEVEN_VOICES=[
  {id:"EXAVITQu4vr4xnSDxMaL", name:"Sarah",    desc:"Warm & natural · English",    lang:"en"},
  {id:"21m00Tcm4TlvDq8ikWAM", name:"Rachel",   desc:"Calm & professional · English", lang:"en"},
  {id:"AZnzlk1XvdvUeBnXmlld", name:"Domi",     desc:"Strong & expressive · English",lang:"en"},
  {id:"MF3mGyEYCl7XYWbV9V6O", name:"Elli",     desc:"Soft & emotional · English",   lang:"en"},
  {id:"TxGEqnHWrfWFTfGW9XjX", name:"Josh",     desc:"Deep & resonant · English",    lang:"en"},
  {id:"VR6AewLTigWG4xSOukaG", name:"Arnold",   desc:"Bold character voice · English",lang:"en"},
  {id:"pNInz6obpgDQGcFmaJgB", name:"Adam",     desc:"Clear & neutral · English",    lang:"en"},
  {id:"yoZ06aMxZJJ28mfd3POQ", name:"Sam",      desc:"Raspy & creative · English",   lang:"en"},
];

/* ── 3D MODEL VIEWER ─────────────────────────────────────────────────── */
function ModelViewer({ phase }){
  const mountRef=useRef(null);
  const ctrlRef=useRef(null);
  const [loading,setLoading]=useState(true);
  const [pct,setPct]=useState(0);
  const [msg,setMsg]=useState("Loading…");

  useEffect(()=>{
    let renderer,scene,camera,mixer,clock,controls,destroyed=false,animId;
    async function init(){
      const THREE=await import("three");
      const {FBXLoader}=await import("three/examples/jsm/loaders/FBXLoader.js");
      const {OrbitControls}=await import("three/examples/jsm/controls/OrbitControls.js");
      if(destroyed||!mountRef.current)return;
      const c=mountRef.current;
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
      renderer.setSize(c.clientWidth||800,c.clientHeight||600);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
      c.appendChild(renderer.domElement);
      scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07060f,.0012);
      clock=new THREE.Clock();
      camera=new THREE.PerspectiveCamera(42,c.clientWidth/c.clientHeight,.1,2000);
      camera.position.set(0,130,320);camera.lookAt(0,100,0);
      scene.add(new THREE.AmbientLight(0xffeeff,.7));
      const key=new THREE.DirectionalLight(0xfff0e8,1.6);key.position.set(150,300,150);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
      const rim=new THREE.DirectionalLight(0x9c4dff,.7);rim.position.set(0,120,-250);scene.add(rim);
      const disc=new THREE.Mesh(new THREE.CircleGeometry(90,72),new THREE.MeshBasicMaterial({color:0x7c4dff,transparent:true,opacity:.07,side:THREE.DoubleSide}));
      disc.rotation.x=-Math.PI/2;disc.position.y=.5;scene.add(disc);
      controls=new OrbitControls(camera,renderer.domElement);
      controls.target.set(0,100,0);controls.enableDamping=true;controls.dampingFactor=.07;
      controls.minDistance=80;controls.maxDistance=600;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/1.7;
      controls.autoRotate=true;controls.autoRotateSpeed=.5;ctrlRef.current=controls;
      setMsg("Loading Business Girl model…");
      new FBXLoader().load("/model/business-girl.fbx",
        fbx=>{
          if(destroyed)return;
          const box=new THREE.Box3().setFromObject(fbx);
          const s=210/Math.max(...box.getSize(new THREE.Vector3()).toArray());
          fbx.scale.setScalar(s);fbx.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(s));fbx.position.y=0;
          fbx.traverse(ch=>{if(!ch.isMesh)return;ch.castShadow=ch.receiveShadow=true;const fix=m=>{if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace;if(m)m.needsUpdate=true;};Array.isArray(ch.material)?ch.material.forEach(fix):fix(ch.material);});
          scene.add(fbx);
          if(fbx.animations?.length){mixer=new THREE.AnimationMixer(fbx);mixer.clipAction(fbx.animations[0]).play();}
          setLoading(false);
        },
        xhr=>{if(xhr.total){const p=Math.round(xhr.loaded/xhr.total*100);setPct(p);setMsg(`Loading… ${p}%`);}},
        err=>{console.error(err);setLoading(false);}
      );
      const onResize=()=>{if(!c||!renderer)return;renderer.setSize(c.clientWidth,c.clientHeight);camera.aspect=c.clientWidth/c.clientHeight;camera.updateProjectionMatrix();};
      window.addEventListener("resize",onResize);
      const animate=()=>{if(destroyed)return;animId=requestAnimationFrame(animate);if(mixer)mixer.update(clock.getDelta());controls.update();renderer.render(scene,camera);};
      animate();
      return()=>window.removeEventListener("resize",onResize);
    }
    init().catch(console.error);
    return()=>{destroyed=true;if(animId)cancelAnimationFrame(animId);if(renderer){renderer.dispose();renderer.domElement.remove();}};
  },[]);

  useEffect(()=>{
    if(!ctrlRef.current)return;
    ctrlRef.current.autoRotateSpeed=phase==="speaking"?1.8:phase==="listening"?.2:.5;
  },[phase]);

  return(
    <div ref={mountRef} className="vp-canvas">
      {loading&&(
        <div className="vp-load">
          <div style={{position:"relative",width:72,height:72}}>
            <div className="vp-spin" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
            <img src="/model/girl-preview.png" alt="" style={{position:"absolute",inset:8,width:56,height:56,borderRadius:"50%",objectFit:"cover",opacity:.7}}/>
          </div>
          <div style={{fontSize:13,color:"rgba(232,228,255,.55)",fontFamily:"'DM Sans',sans-serif"}}>{msg}</div>
          <div className="vp-pbar"><div className="vp-pfill" style={{width:`${pct}%`}}/></div>
        </div>
      )}
      {!loading&&<div className="vp-drag-hint">🖱 Drag · Scroll · Auto-rotate</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function Virtual(){
  const navigate=useNavigate();
  const [phase,setPhase]         =useState("idle");   // idle|listening|thinking|speaking
  const [autoSpeak,setAutoSpeak] =useState(true);
  const [particlesOn,setPart]    =useState(true);
  const [emotion,setEmotion]     =useState("neutral");
  const [activeTab,setActiveTab] =useState("settings");
  const [panelOpen,setPanelOpen] =useState(true);
  const [history,setHistory]     =useState([]);
  const [hudUser,setHudUser]     =useState("");
  const [hudIsabel,setHudIsabel] =useState("");
  const [isTyping,setIsTyping]   =useState(false);
  const [lastCmd,setLastCmd]     =useState(null);
  const [textInput,setTextInput] =useState("");

  // Voice selection
  const [voiceMode,setVoiceMode]     =useState("auto");   // "auto"|"eleven"|"browser"
  const [elevenVoice,setElevenVoice] =useState("EXAVITQu4vr4xnSDxMaL"); // Sarah
  const [browserVoices,setBrowserVoices]=useState([]);
  const [browserVoice,setBrowserVoice]  =useState("");

  const waveRef    =useRef(null);
  const recRef     =useRef(null);
  const audioRef   =useRef(null);
  const partRef    =useRef(null);
  const partIntRef =useRef(null);
  const logEndRef  =useRef(null);
  const subTimerRef=useRef(null);

  /* body class */
  useEffect(()=>{document.body.classList.add("vp-open");return()=>document.body.classList.remove("vp-open");},[]);

  /* load browser voices */
  useEffect(()=>{
    const load=()=>setBrowserVoices(window.speechSynthesis?.getVoices()||[]);
    window.speechSynthesis?.addEventListener("voiceschanged",load);setTimeout(load,500);
    return()=>window.speechSynthesis?.removeEventListener("voiceschanged",load);
  },[]);

  /* log scroll */
  useEffect(()=>logEndRef.current?.scrollIntoView({behavior:"smooth"}),[history]);

  /* particles */
  useEffect(()=>{
    if(!particlesOn)return;
    const spawn=()=>{
      if(!partRef.current)return;
      const p=document.createElement("div");p.className="vp-par";
      const sz=Math.random()*4+2,dur=Math.random()*12+8,hue=Math.random()>.5?"260":"300";
      p.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;bottom:-20px;background:hsl(${hue},80%,70%);opacity:.5;animation-duration:${dur}s;animation-delay:${Math.random()*5}s`;
      partRef.current.appendChild(p);setTimeout(()=>p.remove(),(dur+5)*1000);
    };
    for(let i=0;i<6;i++)setTimeout(spawn,i*400);
    partIntRef.current=setInterval(spawn,1200);
    return()=>clearInterval(partIntRef.current);
  },[particlesOn]);

  /* waveform anim */
  const [wave,setWave]=useState(Array(20).fill(2));
  useEffect(()=>{
    const active=phase!=="idle"&&phase!=="thinking";
    if(!active){setWave(Array(20).fill(2));return;}
    waveRef.current=setInterval(()=>setWave(prev=>prev.map(()=>active?Math.random()*32+4:2)),90);
    return()=>clearInterval(waveRef.current);
  },[phase]);

  /* ── TTS ── */
  const speakText=useCallback(async(text)=>{
    if(!autoSpeak||!text.trim())return;
    setPhase("speaking");
    try{
      let played=false;
      // ElevenLabs via backend
      if(voiceMode==="auto"||voiceMode==="eleven"){
        try{
          const res=await fetch("/api/chat/tts",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,voiceId:elevenVoice})});
          if(res.ok){
            const blob=await res.blob();const url=URL.createObjectURL(blob);
            if(audioRef.current){audioRef.current.pause();}
            const audio=new Audio(url);audioRef.current=audio;
            audio.onended=()=>{setPhase("idle");URL.revokeObjectURL(url);};
            audio.play();played=true;
          }
        }catch{}
      }
      if(!played&&(voiceMode==="auto"||voiceMode==="browser")&&window.speechSynthesis){
        window.speechSynthesis.cancel();
        const utt=new SpeechSynthesisUtterance(text);
        utt.rate=1.05;utt.pitch=1.1;
        const vl=window.speechSynthesis.getVoices();
        const v=browserVoice?vl.find(x=>x.name===browserVoice):vl.find(x=>x.name.includes("Samantha")||x.name.includes("Google UK English Female"))||vl[0];
        if(v)utt.voice=v;
        utt.onend=()=>setPhase("idle");
        window.speechSynthesis.speak(utt);
        played=true;
      }
      if(!played)setPhase("idle");
    }catch{setPhase("idle");}
  },[autoSpeak,voiceMode,browserVoice]);

  /* ── AI ── */
  const askIsabel=useCallback(async(input)=>{
    if(!input.trim())return;
    setHudUser(input);setHudIsabel("");setLastCmd(null);setIsTyping(true);setPhase("thinking");
    setHistory(h=>[...h,{role:"user",text:input}]);
    const hist=history.slice(-8).map(m=>({role:m.role==="user"?"USER":"CHATBOT",message:m.text}));
    try{
      const res=await fetch("https://api.cohere.ai/v1/chat",{
        method:"POST",
        headers:{Authorization:"Bearer nBtLPfWMgzuTBoxVnY04pOvJpVRk6waxOQ4bhHf7","Content-Type":"application/json"},
        body:JSON.stringify({model:"command-r7b-12-2024",message:input,preamble:PREAMBLE,chat_history:hist,temperature:.72,max_tokens:80}),
      });
      const data=await res.json();
      const full=data.text?.trim()||"Sorry, I had a hiccup!";
      const clean=cleanReply(full);const cmd=extractCmd(full);const em=detectEmotion(clean);
      setEmotion(em);setHudIsabel(clean||full);setLastCmd(cmd||null);setIsTyping(false);
      setHistory(h=>[...h,{role:"isabel",text:clean||full,cmd}]);
      clearTimeout(subTimerRef.current);
      subTimerRef.current=setTimeout(()=>{setHudUser("");setHudIsabel("");},7000);
      await speakText(clean||full);
    }catch(e){
      console.error("[AI]",e);setIsTyping(false);setPhase("idle");
      await speakText("Sorry, I had a little hiccup!");
    }
  },[history,speakText]);

  /* ── mic ── */
  const toggleMic=useCallback(()=>{
    if(phase==="speaking"){
      if(audioRef.current)audioRef.current.pause();
      if(window.speechSynthesis)window.speechSynthesis.cancel();
      setPhase("idle");return;
    }
    if(phase==="listening"){recRef.current?.stop();return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Use Chrome or Edge for voice input.");return;}
    const rec=new SR();rec.continuous=false;rec.interimResults=true;rec.lang="en-US";
    rec.onstart=()=>{setPhase("listening");setHudUser("");setHudIsabel("");};
    rec.onresult=e=>{
      let final="",interim="";
      for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)final+=t;else interim+=t;}
      setHudUser(final||interim);
      if(final){rec.stop();askIsabel(final);}
    };
    rec.onend=()=>setPhase(p=>p==="listening"?"idle":p);
    rec.onerror=()=>setPhase("idle");
    recRef.current=rec;rec.start();
  },[phase,askIsabel]);

  const handleSubmit=e=>{e?.preventDefault();if(!textInput.trim())return;const t=textInput.trim();setTextInput("");askIsabel(t);};

  /* status */
  const statusMap={
    idle:{label:"Online & Ready",color:"#4cff91"},
    listening:{label:"Listening…",color:"#4df5ff"},
    thinking:{label:"Thinking…",color:"#ff9f43"},
    speaking:{label:"Speaking…",color:"#a67cff"},
  };
  const {label:sLabel,color:sColor}=statusMap[phase]||statusMap.idle;
  const emoColor={neutral:"#7c4dff",happy:"#4cff91",sad:"#4df5ff",angry:"#ff4d6a"}[emotion];
  const emoLabel={neutral:"Neutral 😐",happy:"Happy 😊",sad:"Sad 😢",angry:"Intense 😤"}[emotion];

  return(
    <>
      <style>{css}</style>
      <div className="vp-root">
        <div className="vp-bg"/><div className="vp-grid"/>
        <div ref={partRef} style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none"}}/>
        <Navbar showWip/>
        <div className="vp-main">

          {/* ── STAGE ── */}
          <div className="vp-stage">
            <ModelViewer phase={phase}/>
            <div className="vp-hud">
              {/* bubbles */}
              {(hudUser||hudIsabel||isTyping)&&(
                <div className="vp-bubbles">
                  {hudUser&&<div className="vp-you">{hudUser}</div>}
                  {isTyping&&<div className="vp-isabel"><div className="vp-typing"><div className="vp-dot"/><div className="vp-dot"/><div className="vp-dot"/></div></div>}
                  {!isTyping&&hudIsabel&&(
                    <div className="vp-isabel">
                      {hudIsabel}
                      {lastCmd&&<div className="vp-cmd-pill">⚡ {lastCmd.action}: {lastCmd.value}</div>}
                    </div>
                  )}
                </div>
              )}
              {phase!=="idle"&&phase!=="thinking"&&(
                <div className="vp-wave">{wave.map((h,i)=>(
                  <div key={i} className="vp-wbar" style={{height:`${h}px`,animationDelay:`${(i*.07).toFixed(2)}s`}}/>
                ))}</div>
              )}
              <div className="vp-status">
                <div className="vp-sdot" style={{background:sColor,boxShadow:`0 0 10px ${sColor}`}}/>
                <span className="vp-stxt">{sLabel}</span>
                <span style={{fontSize:10,color:"rgba(232,228,255,.28)",marginLeft:8}}>{emoLabel}</span>
              </div>
              <div className="vp-ctrls">
                <button className={`vp-btn${phase==="listening"?" on":""}`} onClick={toggleMic} disabled={phase==="thinking"}>
                  <span className="vp-bico">{phase==="listening"?"⏹️":phase==="speaking"?"🔇":"🎙️"}</span>
                  <span>{phase==="listening"?"Stop":phase==="speaking"?"Mute":"Speak"}</span>
                </button>
                <button className={`vp-btn${autoSpeak?" on":""}`} onClick={()=>setAutoSpeak(v=>!v)}>
                  <span className="vp-bico">🔊</span><span>Auto {autoSpeak?"ON":"OFF"}</span>
                </button>
                <button className="vp-btn" onClick={()=>askIsabel("Say hello and introduce yourself briefly")} disabled={phase!=="idle"}>
                  <span className="vp-bico">✦</span><span>Greet</span>
                </button>
                <button className="vp-btn" onClick={()=>navigate("/chat")}>
                  <span className="vp-bico">💬</span><span>Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── PANEL ── */}
          <div className={`vp-panel${panelOpen?"":" vp-panel-hide"}`}>
            <div className="vp-ph">
              <div className="vp-ptitle">Isabel <span style={{background:"linear-gradient(130deg,#a67cff,#c84dff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI</span></div>
              <div className="vp-psub">Virtual Assistant · Voice Enabled</div>
            </div>

            <div className="vp-tabs">
              {[["settings","⚙️ Settings"],["chat","💬 Chat"],["pc","🖥️ PC Cmds"]].map(([t,l])=>(
                <div key={t} className={`vp-tab${activeTab===t?" act":""}`} onClick={()=>setActiveTab(t)}>{l}</div>
              ))}
            </div>

            {/* ── SETTINGS TAB ── */}
            {activeTab==="settings"&&(
              <div className="vp-pb">
                {/* Emotion */}
                <div className="vp-emo">
                  <div className="vp-edot" style={{background:emoColor,boxShadow:`0 0 8px ${emoColor}`}}/>
                  <span className="vp-etxt">Emotion State</span>
                  <span className="vp-eval">{emoLabel}</span>
                </div>

                {/* Basic toggles */}
                <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(232,228,255,.35)",marginBottom:10}}>GENERAL</div>
                {[
                  {label:"Auto-Speak",sub:"Isabel speaks replies automatically",val:autoSpeak,toggle:()=>setAutoSpeak(v=>!v)},
                  {label:"Particle Effects",sub:"Ambient floating particles",val:particlesOn,toggle:()=>setPart(v=>!v)},
                ].map(({label,sub,val,toggle})=>(
                  <div key={label} className="vp-row">
                    <div><div className="vp-rlabel">{label}</div><div className="vp-rsub">{sub}</div></div>
                    <div className={`vp-tog${val?" on":""}`} onClick={toggle}/>
                  </div>
                ))}

                {/* Voice selection */}
                <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(232,228,255,.35)",marginTop:18,marginBottom:10}}>VOICE ENGINE</div>

                <div className="vp-row" style={{flexDirection:"column",alignItems:"stretch",gap:8}}>
                  <div><div className="vp-rlabel">Voice Mode</div><div className="vp-rsub">How Isabel speaks</div></div>
                  <select className="vp-sel" value={voiceMode} onChange={e=>setVoiceMode(e.target.value)}>
                    <option value="auto">🤖 Auto (ElevenLabs → Browser)</option>
                    <option value="eleven">🎤 ElevenLabs (High Quality)</option>
                    <option value="browser">🔈 Browser Voice (Offline)</option>
                  </select>
                </div>

                {/* ElevenLabs voice picker */}
                {(voiceMode==="auto"||voiceMode==="eleven")&&(
                  <div style={{marginTop:14}}>
                    <span className="vp-sel-label">ElevenLabs Voice</span>
                    {ELEVEN_VOICES.map(v=>(
                      <div key={v.id} className={`vp-vcard${elevenVoice===v.id?" vp-vsel":""}`} onClick={()=>setElevenVoice(v.id)}>
                        <div className="vp-vdot"/>
                        <div>
                          <div className="vp-vname">{v.name}</div>
                          <div className="vp-vdesc">{v.desc}</div>
                        </div>
                        {elevenVoice===v.id&&<span style={{fontSize:10,color:"#a67cff",marginLeft:"auto"}}>✓ Active</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Browser voice picker */}
                {(voiceMode==="auto"||voiceMode==="browser")&&(
                  <div style={{marginTop:14}}>
                    <span className="vp-sel-label">Browser Voice (fallback)</span>
                    <select className="vp-sel" value={browserVoice} onChange={e=>setBrowserVoice(e.target.value)}>
                      <option value="">Auto-select best voice</option>
                      {browserVoices.map(v=><option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                    </select>
                  </div>
                )}

                {/* Test voice button */}
                <button onClick={()=>speakText("Hi! I am Isabel. This is how I sound right now.")}
                  style={{width:"100%",marginTop:14,padding:"9px",borderRadius:9,background:"rgba(124,77,255,.12)",border:"1px solid rgba(124,77,255,.25)",color:"#a67cff",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",transition:"all .2s"}}
                  disabled={phase==="speaking"}>
                  🔊 Test Voice
                </button>

                {/* Avatar section */}
                <div style={{fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(232,228,255,.35)",marginTop:18,marginBottom:10}}>AVATAR</div>
                <div style={{background:"rgba(124,77,255,.06)",border:"1px solid rgba(124,77,255,.12)",borderRadius:10,padding:12,display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <img src="/model/girl-preview.png" alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",border:"1px solid rgba(124,77,255,.2)"}}/>
                  <div>
                    <div style={{fontSize:13,color:"#e8e4ff",fontWeight:600}}>Business Girl</div>
                    <div style={{fontSize:11,color:"rgba(232,228,255,.38)"}}>FBX · Three.js · WebGL</div>
                  </div>
                </div>

                <div style={{background:"#14112a",border:"1px solid rgba(124,77,255,.15)",borderRadius:12,padding:14,textAlign:"center"}}>
                  <div style={{fontSize:12,color:"rgba(232,228,255,.4)",marginBottom:10}}>Full AI Chat Interface</div>
                  <button onClick={()=>navigate("/chat")} style={{padding:"8px 20px",borderRadius:9,background:"#7c4dff",border:"none",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>
                    Open Chat →
                  </button>
                </div>
              </div>
            )}

            {/* ── CHAT LOG ── */}
            {activeTab==="chat"&&(
              <div className="vp-pb vp-log">
                {history.length===0&&<div style={{color:"rgba(232,228,255,.28)",fontSize:12,textAlign:"center",paddingTop:20}}>Start talking to Isabel ↓</div>}
                {history.map((m,i)=>(
                  <div key={i} className="vp-lmsg">
                    {m.role==="user"
                      ?<div className="vp-lyou"><span>You: </span>{m.text}</div>
                      :<><div className="vp-lisabel"><span>Isabel: </span>{m.text}</div>
                        {m.cmd&&<div className="vp-lcmd">⚡ {m.cmd.action}:{m.cmd.value}</div>}
                      </>
                    }
                  </div>
                ))}
                <div ref={logEndRef}/>
              </div>
            )}

            {/* ── PC COMMANDS ── */}
            {activeTab==="pc"&&(
              <div className="vp-pb">
                <div style={{fontSize:11,color:"rgba(232,228,255,.3)",marginBottom:12}}>Tap to send a PC command to Isabel:</div>
                {[["open chrome","🚀"],["open spotify","🚀"],["open notepad","🚀"],["open downloads","📁"],["open youtube","🌐"],["take screenshot","⚡"],["lock screen","⚡"],["volume up","⚡"],["shutdown","⚡"]].map(([cmd,ico])=>(
                  <div key={cmd} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(124,77,255,.07)",cursor:"pointer"}}
                    onClick={()=>askIsabel(cmd)}>
                    <span style={{fontSize:15}}>{ico}</span>
                    <div style={{flex:1,fontSize:12,color:"#e8e4ff"}}>"{cmd}"</div>
                    <span style={{fontSize:10,color:"#7c4dff"}}>Try →</span>
                  </div>
                ))}
              </div>
            )}

            {/* text input */}
            <form className="vp-irow" onSubmit={handleSubmit}>
              <input className="vp-inp" value={textInput} onChange={e=>setTextInput(e.target.value)}
                placeholder="Type to Isabel… or use mic" disabled={phase!=="idle"}/>
              <button type="submit" className="vp-send" disabled={phase!=="idle"||!textInput.trim()}>➤</button>
            </form>
          </div>
        </div>

        {/* mobile FAB */}
        <button className="vp-fab" onClick={()=>setPanelOpen(v=>!v)}>{panelOpen?"✕":"⚙️"}</button>
      </div>
    </>
  );
}