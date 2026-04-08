import { useEffect, useRef } from "react";

const orbStates = {
  idle: { filter: "", shadowColor: "rgba(124,77,255,.9)", extraClass: "" },
  thinking: { filter: "hue-rotate(30deg) brightness(1.2)", shadowColor: "rgba(255,159,67,.9)", extraClass: "" },
  talking: { filter: "", shadowColor: "rgba(124,77,255,.9)", extraClass: "talking" },
  listening: { filter: "hue-rotate(-30deg)", shadowColor: "rgba(77,245,255,.9)", extraClass: "listening" },
};

export default function OrbAvatar({ state = "idle", size = 110, onClick }) {
  const orbRef = useRef(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;
    const cfg = orbStates[state] || orbStates.idle;
    orb.style.filter = cfg.filter;
    orb.className = `orb-core ${cfg.extraClass}`;
  }, [state]);

  return (
    <div className="orb-stage" style={{ width: size * 2.36, height: size * 2.36 }}>
      <style>{`
        .orb-stage { position: relative; display: flex; align-items: center; justify-content: center; }
        .orb-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(124,77,255,.18); animation: ring-pulse 3s ease-in-out infinite; }
        .orb-ring:nth-child(1) { width: ${size*1.27}px; height: ${size*1.27}px; }
        .orb-ring:nth-child(2) { width: ${size*1.73}px; height: ${size*1.73}px; border-color: rgba(124,77,255,.1); animation-delay: .6s; }
        .orb-ring:nth-child(3) { width: ${size*2.22}px; height: ${size*2.22}px; border-color: rgba(124,77,255,.06); animation-delay: 1.2s; }
        .orb-core {
          position: relative; z-index: 5;
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: radial-gradient(circle at 35% 28%, #d4a7ff, #a67cff, #7c4dff, #1a0070);
          box-shadow: 0 0 60px rgba(124,77,255,.9), 0 0 120px rgba(124,77,255,.4), inset 0 1px 20px rgba(255,255,255,.15);
          animation: orb-float 3.4s ease-in-out infinite, orb-glow 2.4s ease-in-out infinite;
          cursor: pointer; transition: transform .2s;
        }
        .orb-core:hover { transform: scale(1.07); }
        .orb-core::before {
          content: ''; position: absolute; top: 15%; left: 20%; width: 30%; height: 18%;
          background: rgba(255,255,255,.25); border-radius: 50%; filter: blur(4px); transform: rotate(-20deg);
        }
        .orb-core.talking { animation: orb-float 3.4s ease-in-out infinite, orb-talk .5s ease-in-out infinite; }
        .orb-core.listening {
          animation: orb-float 3.4s ease-in-out infinite, orb-listen .3s ease-in-out infinite;
          box-shadow: 0 0 80px rgba(77,245,255,.9), 0 0 160px rgba(77,245,255,.4);
        }
        @keyframes orb-talk { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes orb-listen { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>
      <div className="orb-ring" />
      <div className="orb-ring" />
      <div className="orb-ring" />
      <div className="orb-core" ref={orbRef} onClick={onClick} />
    </div>
  );
}
