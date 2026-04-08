import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const S = {
  page: { background: "#06050e", color: "#e8e4ff", minHeight: "100vh", overflowX: "hidden" },
  sectionLabel: {
    display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11,
    color: "#a67cff", letterSpacing: ".14em", textTransform: "uppercase",
    padding: "5px 14px", borderRadius: 100, background: "rgba(124,77,255,.1)",
    border: "1px solid rgba(124,77,255,.22)", marginBottom: 18,
  },
};

/* ──────────── Reveal hook ──────────── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ──────────── Progress bar ──────────── */
function ProgressBar() {
  const barRef = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (barRef.current) barRef.current.style.width = pct + "%";
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={barRef} style={{ position: "fixed", top: 0, left: 0, height: 2, zIndex: 200, background: "linear-gradient(90deg,#7c4dff,#c84dff)", width: 0, transition: "width .1s" }} />;
}

/* ──────────── Hero ──────────── */
function Hero({ nav }) {
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 90px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", width: 700, height: 700, background: "rgba(90,25,200,.3)", top: -200, left: -200 }} />
      <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", width: 500, height: 500, background: "rgba(200,77,255,.15)", bottom: -150, right: -150 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,77,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(124,77,255,.14) 1px,transparent 1px)", backgroundSize: "62px 62px", maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%,black 20%,transparent 75%)", pointerEvents: "none" }} />

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(124,77,255,.1)", border: "1px solid rgba(124,77,255,.28)", fontSize: 12, color: "#a67cff", marginBottom: 32, animation: "fadeUp .7s ease both" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c84dff", animation: "pulse 2s infinite" }} />
        ✦ Introducing Isabel AI — v1.0
      </div>

      <div style={{ width: 150, height: 150, margin: "0 auto 40px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeUp .7s .1s ease both" }}>
        {[150, 125].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: `1px solid rgba(124,77,255,${i === 0 ? ".1" : ".22"})`, animation: `ring-pulse 3.5s ease-in-out ${i * .5}s infinite` }} />
        ))}
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle at 38% 32%,#a67cff,#7c4dff,#22008a)", boxShadow: "0 0 80px rgba(124,77,255,.9),0 0 180px rgba(124,77,255,.45)", animation: "float 3.5s ease-in-out infinite, glow 2.5s ease-in-out infinite", position: "absolute", zIndex: 2 }} />
      </div>

      <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(52px,7vw,96px)", fontWeight: 800, lineHeight: .98, color: "#fff", marginBottom: 8, animation: "fadeUp .7s .2s ease both" }}>
        <span className="text-gradient">Isabel AI</span>
      </h1>
      <div style={{ fontFamily: "'DM Sans',sans-serif", fontStyle: "italic", fontSize: "clamp(18px,2.5vw,26px)", color: "rgba(232,228,255,.45)", marginBottom: 26, animation: "fadeUp .7s .25s ease both" }}>Your Next-Generation Virtual Assistant</div>
      <p style={{ fontSize: 17, color: "rgba(232,228,255,.45)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto 44px", animation: "fadeUp .7s .3s ease both" }}>
        A living, breathing AI that thinks, speaks, and listens — with a stunning animated avatar, real-time voice interaction, and intelligent conversation memory.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", animation: "fadeUp .7s .35s ease both" }}>
        <button onClick={() => nav("/register")} style={{ padding: "14px 34px", borderRadius: 12, background: "#7c4dff", color: "#fff", border: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 500, cursor: "pointer", boxShadow: "0 0 36px rgba(124,77,255,.45)" }}>
          🚀 Get Started Free
        </button>
        <button onClick={() => document.getElementById("what")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: "14px 34px", borderRadius: 12, background: "transparent", color: "#e8e4ff", border: "1px solid rgba(124,77,255,.2)", fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 500, cursor: "pointer" }}>
          Explore ↓
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(232,228,255,.45)", letterSpacing: ".1em" }}>
        <span>SCROLL TO EXPLORE</span>
        <span style={{ animation: "bounce-down 1.5s infinite" }}>↓</span>
      </div>
    </section>
  );
}

/* ──────────── What is Isabel ──────────── */
function What() {
  const cards = [
    { icon: "🧠", name: "AI Powered", desc: "State-of-the-art language model for human-level conversation on any topic" },
    { icon: "🎙️", name: "Voice First", desc: "Speak naturally — Isabel transcribes, understands, and speaks back" },
    { icon: "🤖", name: "Living Avatar", desc: "An animated glowing orb that reacts to every moment of conversation" },
    { icon: "⚡", name: "Real-time", desc: "Instant responses with typing indicators and smooth animations" },
  ];
  return (
    <section id="what" style={{ padding: "120px 48px", background: "#0d0b1c", borderTop: "1px solid rgba(124,77,255,.14)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", width: 500, height: 500, background: "rgba(124,77,255,.1)", top: -100, right: -100, pointerEvents: "none" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
        <div className="reveal">
          <div style={S.sectionLabel}>✦ What is Isabel AI</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(34px,4vw,54px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, marginBottom: 20 }}>More than just<br /><span style={{ background: "linear-gradient(130deg,#a67cff,#c84dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>a chatbot</span></h2>
          <p style={{ fontSize: 15, color: "rgba(232,228,255,.45)", lineHeight: 1.85, marginBottom: 20 }}>Isabel AI is a next-generation virtual assistant built on the MERN stack — combining MongoDB, Express, React, and Node.js with cutting-edge AI.</p>
          <p style={{ fontSize: 15, color: "rgba(232,228,255,.45)", lineHeight: 1.85 }}>Unlike traditional chatbots, Isabel can <strong style={{ color: "#fff" }}>hear you speak</strong>, <strong style={{ color: "#fff" }}>respond in voice</strong>, and <strong style={{ color: "#fff" }}>react visually</strong> through her glowing orb avatar.</p>
        </div>
        <div className="reveal d1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {cards.map((c) => (
            <div key={c.name} style={{ background: "#12102a", border: "1px solid rgba(124,77,255,.14)", borderRadius: 16, padding: "22px 20px", transition: "all .3s", cursor: "default" }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "rgba(232,228,255,.45)", lineHeight: 1.65 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────── How It Works ──────────── */
function HowItWorks() {
  const steps = [
    { n: "01", icon: "📝", title: "Create Account", desc: "Sign up free in seconds with email — your data stored securely in MongoDB" },
    { n: "02", icon: "💬", title: "Start Chatting", desc: "Type or speak your message and get an instant GPT-4 powered response" },
    { n: "03", icon: "🎙️", title: "Use Your Voice", desc: "Tap the mic, speak naturally — Isabel listens and responds with TTS" },
    { n: "04", icon: "🚀", title: "Full History", desc: "All conversations saved. Pick up where you left off anytime" },
  ];
  return (
    <section id="how" style={{ padding: "120px 48px", background: "#0d0b1c", borderTop: "1px solid rgba(124,77,255,.14)", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={S.sectionLabel} className="reveal">✦ How It Works</div>
      <h2 className="reveal d1" style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(34px,4vw,54px)", fontWeight: 800, color: "#fff", marginBottom: 14 }}>
        Simple. Powerful. <span style={{ background: "linear-gradient(130deg,#a67cff,#c84dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Magical.</span>
      </h2>
      <p className="reveal d2" style={{ fontSize: 15, color: "rgba(232,228,255,.45)", maxWidth: 520, margin: "0 auto 64px", lineHeight: 1.75 }}>Getting started takes under 30 seconds.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", maxWidth: 1060, margin: "0 auto", position: "relative" }}>
        <div style={{ position: "absolute", top: 36, left: "12.5%", right: "12.5%", height: 1, background: "rgba(124,77,255,.14)" }} />
        {steps.map((s, i) => (
          <div key={s.n} className={`reveal d${i + 1}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", zIndex: 1 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#12102a", border: "1px solid rgba(124,77,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#a67cff", marginBottom: 22 }}>{s.n}</div>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: "rgba(232,228,255,.45)", lineHeight: 1.65 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────── Features ──────────── */
function Features() {
  return (
    <section id="features" style={{ padding: "120px 48px", background: "#06050e", borderTop: "1px solid rgba(124,77,255,.14)" }}>
      <div className="reveal" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 64px" }}>
        <div style={{ ...S.sectionLabel, display: "inline-flex", marginBottom: 16 }}>✦ Core Features</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(34px,4vw,54px)", fontWeight: 800, color: "#fff", lineHeight: 1.06, marginBottom: 14 }}>
          Everything you need.<br /><span style={{ background: "linear-gradient(130deg,#a67cff,#c84dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nothing you don't.</span>
        </h2>
        <p style={{ fontSize: 15, color: "rgba(232,228,255,.45)", lineHeight: 1.75 }}>Isabel is packed with powerful features designed to make every interaction effortless.</p>
      </div>

      {[
        {
          label: "💬 AI Chat", title: ["Conversations that", "actually understand you"],
          desc: "Isabel uses GPT-4 to discuss anything — coding, creative writing, analysis. Conversation history is stored in MongoDB for seamless continuity.",
          points: ["Context-aware multi-turn via MongoDB", "GPT-4o-mini powered responses", "Full markdown & code rendering", "Persistent chat history sidebar"],
          visual: (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {[["ai","Hi! I'm Isabel, your MERN AI assistant 👋"],["u","Can you help me debug my code?"],["ai","Absolutely! Paste your code and I'll take a look."]].map(([r,t],i)=>(
                <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-end", flexDirection: r==="u"?"row-reverse":"row" }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",flexShrink:0,background:r==="ai"?"radial-gradient(circle at 38% 32%,#a67cff,#7c4dff)":"rgba(124,77,255,.2)",border:r==="u"?"1px solid rgba(124,77,255,.2)":"none",boxShadow:r==="ai"?"0 0 10px rgba(124,77,255,.5)":undefined }} />
                  <div style={{ padding:"9px 14px",borderRadius:12,fontSize:12,lineHeight:1.5,maxWidth:"75%",background:r==="ai"?"#12102a":"#7c4dff",border:r==="ai"?"1px solid rgba(124,77,255,.14)":"none",color:"#e8e4ff",[r==="ai"?"borderBottomLeftRadius":"borderBottomRightRadius"]:3 }}>{t}</div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#a67cff,#7c4dff)" }} />
                <div style={{ padding:"9px 14px",borderRadius:12,background:"#12102a",border:"1px solid rgba(124,77,255,.14)" }}>
                  <div style={{ display:"flex",gap:4 }}>
                    {[0,.15,.3].map((d,i)=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:"#a67cff",animation:`bounce .9s ${d}s infinite` }} />)}
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          label: "🗣️ Voice I/O", title: ["Speak naturally,", "Isabel responds"],
          desc: "Web Speech API for voice input + browser TTS output. The orb avatar reacts in real-time — listening in cyan, thinking in amber, speaking in violet.",
          points: ["Real-time speech transcription", "Text-to-speech with voice selection", "Animated orb reacts to state", "Auto-send on speech end"],
          rev: true,
          visual: (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:18,width:"100%" }}>
              <div style={{ width:70,height:70,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#a67cff,#7c4dff)",boxShadow:"0 0 40px rgba(124,77,255,.8)",animation:"glow 2.5s ease-in-out infinite" }} />
              <div style={{ display:"flex",alignItems:"center",gap:4,height:50 }}>
                {[12,28,46,34,50,36,48,28,14].map((h,i)=>(
                  <div key={i} style={{ width:4,borderRadius:4,background:"#a67cff",height:h,animation:`wave-idle 1.2s ${i*.08}s ease-in-out infinite` }} />
                ))}
              </div>
              <div style={{ fontSize:12,color:"#a67cff" }}>Isabel is speaking...</div>
            </div>
          ),
        },
        {
          label: "🗄️ MERN Stack", title: ["Full-stack,", "production-ready"],
          desc: "MongoDB stores all conversations. Express REST API handles auth and chat. React frontend with React Router. Node.js backend with JWT authentication.",
          points: ["MongoDB conversation persistence", "JWT auth with httpOnly cookies", "REST API with protected routes", "React Context for state management"],
          visual: (
            <div style={{ display:"flex",flexDirection:"column",gap:8,width:"100%" }}>
              {[["🍃 MongoDB","Conversations & Users","#4cff91"],["⚡ Express","REST API & Auth","#a67cff"],["⚛️ React","UI & State","#4df5ff"],["🟢 Node.js","Server Runtime","#7c4dff"]].map(([n,d,c])=>(
                <div key={n} style={{ background:"#12102a",border:"1px solid rgba(124,77,255,.14)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontSize:18 }}>{n.split(" ")[0]}</span>
                  <div>
                    <div style={{ fontSize:13,color:"#fff",fontWeight:500 }}>{n.split(" ").slice(1).join(" ")}</div>
                    <div style={{ fontSize:11,color:"rgba(232,228,255,.45)" }}>{d}</div>
                  </div>
                  <div style={{ marginLeft:"auto",width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 8px ${c}` }} />
                </div>
              ))}
            </div>
          ),
        },
      ].map(({ label, title, desc, points, visual, rev }, fi) => (
        <div key={fi} className="reveal" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:72, alignItems:"center", maxWidth:1060, margin:"0 auto 80px", direction: rev ? "rtl" : undefined }}>
          <div style={{ background:"#0d0b1c",border:"1px solid rgba(124,77,255,.14)",borderRadius:24,padding:36,display:"flex",alignItems:"center",justifyContent:"center",minHeight:240,position:"relative",overflow:"hidden", direction:"ltr" }}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(124,77,255,.5),transparent)" }} />
            {visual}
          </div>
          <div style={{ direction:"ltr" }}>
            <div style={{ ...S.sectionLabel, display:"inline-flex", marginBottom:14 }}>{label}</div>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,2.8vw,38px)",fontWeight:800,color:"#fff",lineHeight:1.1,marginBottom:14 }}>
              {title[0]}<br /><span style={{ background:"linear-gradient(130deg,#a67cff,#c84dff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{title[1]}</span>
            </h3>
            <p style={{ fontSize:15,color:"rgba(232,228,255,.45)",lineHeight:1.8,marginBottom:22 }}>{desc}</p>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {points.map(p=>(
                <div key={p} style={{ display:"flex",alignItems:"flex-start",gap:10,fontSize:13,color:"rgba(232,228,255,.45)" }}>
                  <div style={{ width:18,height:18,borderRadius:5,flexShrink:0,background:"rgba(124,77,255,.15)",border:"1px solid rgba(124,77,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#a67cff",marginTop:1 }}>✓</div>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

/* ──────────── Tech Stack ──────────── */
function Tech() {
  const pills = ["🍃 MongoDB","⚡ Express.js","⚛️ React 18","🟢 Node.js","🤖 GPT-4o-mini","🔐 JWT Auth","🎤 Web Speech API","🔊 Speech Synthesis","📱 Fully Responsive","🔒 httpOnly Cookies"];
  return (
    <section id="tech" style={{ padding: "100px 48px", background: "#06050e", borderTop: "1px solid rgba(124,77,255,.14)", textAlign: "center" }}>
      <div style={S.sectionLabel} className="reveal">✦ Built With</div>
      <h2 className="reveal d1" style={{ fontFamily:"'Syne',sans-serif",fontSize:"clamp(30px,3.5vw,46px)",fontWeight:800,color:"#fff",lineHeight:1.08,marginBottom:14 }}>
        Powered by the<br /><span style={{ background:"linear-gradient(130deg,#a67cff,#c84dff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>best in class</span>
      </h2>
      <p className="reveal d2" style={{ fontSize:15,color:"rgba(232,228,255,.45)",maxWidth:480,margin:"0 auto 52px",lineHeight:1.75 }}>Isabel is built on carefully chosen technologies for the best possible experience.</p>
      <div className="reveal d2" style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:12,maxWidth:780,margin:"0 auto" }}>
        {pills.map(p=>(
          <div key={p} style={{ padding:"12px 22px",borderRadius:100,background:"#0d0b1c",border:"1px solid rgba(124,77,255,.14)",fontSize:14,color:"#e8e4ff",display:"flex",alignItems:"center",gap:9,cursor:"default" }}>{p}</div>
        ))}
      </div>
    </section>
  );
}

/* ──────────── CTA ──────────── */
function CTA({ nav }) {
  return (
    <section style={{ padding: "130px 48px", background: "#0d0b1c", borderTop: "1px solid rgba(124,77,255,.14)", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position:"absolute",borderRadius:"50%",filter:"blur(80px)",width:700,height:700,background:"rgba(124,77,255,.15)",top:-300,left:"50%",transform:"translateX(-50%)",pointerEvents:"none" }} />
      <div className="reveal" style={{ width:120,height:120,margin:"0 auto 40px",position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
        {[120,100].map((s,i)=><div key={i} style={{ position:"absolute",width:s,height:s,borderRadius:"50%",border:`1px solid rgba(124,77,255,${i===0?.1:.2})`,animation:`ring-pulse 3.5s ease-in-out ${i*.5}s infinite` }} />)}
        <div style={{ width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#a67cff,#7c4dff,#1a0070)",boxShadow:"0 0 80px rgba(124,77,255,1),0 0 180px rgba(124,77,255,.5)",animation:"float 3.5s ease-in-out infinite,glow 2.5s ease-in-out infinite" }} />
      </div>
      <div className="reveal d1" style={{ fontFamily:"'Syne',sans-serif",fontSize:13,color:"#a67cff",letterSpacing:".14em",textTransform:"uppercase",marginBottom:18 }}>Ready when you are</div>
      <h2 className="reveal d1" style={{ fontFamily:"'Syne',sans-serif",fontSize:"clamp(40px,5.5vw,80px)",fontWeight:800,color:"#fff",lineHeight:1,marginBottom:18 }}>
        Meet<br /><span className="text-gradient">Isabel.</span>
      </h2>
      <p className="reveal d2" style={{ fontSize:17,color:"rgba(232,228,255,.45)",maxWidth:520,margin:"0 auto 44px",lineHeight:1.8 }}>Start your first conversation today. Sign up and experience the future of AI interaction.</p>
      <div className="reveal d3" style={{ display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap" }}>
        <button onClick={() => nav("/register")} style={{ padding:"16px 40px",borderRadius:13,background:"#7c4dff",color:"#fff",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:500,cursor:"pointer",boxShadow:"0 0 40px rgba(124,77,255,.5)" }}>🚀 Create Free Account</button>
        <button onClick={() => nav("/virtual")} style={{ padding:"16px 40px",borderRadius:13,background:"transparent",color:"#e8e4ff",border:"1px solid rgba(124,77,255,.2)",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:500,cursor:"pointer" }}>✦ Try Virtual Avatar</button>
      </div>
    </section>
  );
}

/* ──────────── Footer ──────────── */
function Footer({ nav }) {
  return (
    <footer style={{ padding:"32px 52px",background:"#06050e",borderTop:"1px solid rgba(124,77,255,.14)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14 }}>
      <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,letterSpacing:".12em",color:"#fff" }}>ISABEL</div>
      <div style={{ display:"flex",gap:26 }}>
        {[["Home","/"],["Chat","/chat"],["Virtual AI","/virtual"]].map(([l,p])=>(
          <span key={l} onClick={() => nav(p)} style={{ fontSize:13,color:"rgba(232,228,255,.45)",cursor:"pointer" }}>{l}</span>
        ))}
      </div>
      <div style={{ fontSize:12,color:"rgba(232,228,255,.22)" }}>© 2026 Isabel AI. All rights reserved.</div>
    </footer>
  );
}

/* ──────────── Page ──────────── */
export default function Introduction() {
  const navigate = useNavigate();
  useReveal();

  return (
    <div style={S.page}>
      <ProgressBar />
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <Hero nav={navigate} />
        <What />
        <HowItWorks />
        <Features />
        <Tech />
        <CTA nav={navigate} />
        <Footer nav={navigate} />
      </div>
    </div>
  );
}
