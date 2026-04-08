import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Please fill all fields");
    if (form.password !== form.confirm) return toast.error("Passwords don't match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created! Welcome to Isabel AI ✨");
      navigate("/chat");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#06050e",padding:24,position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",borderRadius:"50%",filter:"blur(80px)",width:600,height:600,background:"rgba(90,25,200,.25)",top:-200,right:-200,pointerEvents:"none" }} />
      <div style={{ position:"absolute",borderRadius:"50%",filter:"blur(80px)",width:400,height:400,background:"rgba(200,77,255,.12)",bottom:-150,left:-150,pointerEvents:"none" }} />
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(124,77,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(124,77,255,.1) 1px,transparent 1px)",backgroundSize:"60px 60px",maskImage:"radial-gradient(ellipse 70% 70% at 50% 50%,black 20%,transparent 75%)",pointerEvents:"none" }} />

      <div style={{ width:"100%",maxWidth:440,position:"relative",zIndex:2 }}>
        <div style={{ textAlign:"center",marginBottom:36 }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:"radial-gradient(circle at 38% 32%,#a67cff,#7c4dff,#22008a)",boxShadow:"0 0 40px rgba(124,77,255,.8)",margin:"0 auto 16px",animation:"float 3.5s ease-in-out infinite,glow 2.5s ease-in-out infinite" }} />
          <h1 style={{ fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:"#fff",marginBottom:6 }}>
            Join <span style={{ background:"linear-gradient(130deg,#a67cff,#c84dff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Isabel AI</span>
          </h1>
          <p style={{ fontSize:14,color:"rgba(232,228,255,.45)" }}>Create your free account and start chatting</p>
        </div>

        <div style={{ background:"#0f0d1e",border:"1px solid rgba(124,77,255,.2)",borderRadius:20,padding:36 }}>
          <form onSubmit={handleSubmit}>
            {[
              { label:"Full Name", type:"text", key:"name", placeholder:"Your name" },
              { label:"Email", type:"email", key:"email", placeholder:"you@example.com" },
              { label:"Password", type:"password", key:"password", placeholder:"Min 6 characters" },
              { label:"Confirm Password", type:"password", key:"confirm", placeholder:"Repeat your password" },
            ].map(({ label, type, key, placeholder }) => (
              <div key={key} style={{ marginBottom:16 }}>
                <label style={{ display:"block",fontSize:13,color:"rgba(232,228,255,.6)",marginBottom:8,fontWeight:500 }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width:"100%",padding:"11px 14px",background:"#07060f",border:"1px solid rgba(124,77,255,.2)",borderRadius:10,color:"#e8e4ff",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",transition:"border-color .2s" }}
                  onFocus={(e) => e.target.style.borderColor = "#7c4dff"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(124,77,255,.2)"}
                />
              </div>
            ))}

            {/* Password strength indicator */}
            {form.password && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex",gap:4,marginBottom:4 }}>
                  {[1,2,3,4].map(n=>(
                    <div key={n} style={{ flex:1,height:3,borderRadius:2,background: form.password.length >= n*2 ? (form.password.length >= 8 ? "#4cff91" : "#ffd766") : "rgba(124,77,255,.15)",transition:"background .3s" }} />
                  ))}
                </div>
                <div style={{ fontSize:11,color:"rgba(232,228,255,.35)" }}>
                  {form.password.length < 6 ? "Too short" : form.password.length < 8 ? "Fair" : form.password.length < 12 ? "Good" : "Strong"}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width:"100%",padding:"13px",borderRadius:11,background: loading?"rgba(124,77,255,.5)":"#7c4dff",border:"none",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:500,cursor: loading?"not-allowed":"pointer",marginTop:4,boxShadow:"0 0 30px rgba(124,77,255,.4)",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
            >
              {loading ? (
                <><div style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 1s linear infinite" }} />Creating account...</>
              ) : "Create Account →"}
            </button>
          </form>

          <div style={{ textAlign:"center",marginTop:24,fontSize:14,color:"rgba(232,228,255,.45)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color:"#a67cff",textDecoration:"none",fontWeight:500 }}>Sign in</Link>
          </div>
        </div>

        <div style={{ textAlign:"center",marginTop:20 }}>
          <Link to="/" style={{ fontSize:13,color:"rgba(232,228,255,.35)",textDecoration:"none" }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
