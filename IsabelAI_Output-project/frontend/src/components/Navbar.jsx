import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

const styles = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 48px",
    background: "rgba(7,6,15,.85)", backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(124,77,255,.15)",
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17,
    letterSpacing: ".12em", color: "#fff", textDecoration: "none", cursor: "pointer",
  },
  links: { display: "flex", gap: 28, alignItems: "center" },
  link: {
    fontSize: 13, color: "rgba(232,228,255,.6)", textDecoration: "none",
    cursor: "pointer", transition: "color .2s", letterSpacing: ".03em",
  },
  linkActive: { color: "#fff" },
  cta: { display: "flex", gap: 10 },
  btnGhost: {
    padding: "8px 20px", borderRadius: 9, border: "1px solid rgba(124,77,255,.2)",
    background: "transparent", color: "#e8e4ff", fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, cursor: "pointer", transition: "all .2s",
  },
  btnFill: {
    padding: "8px 20px", borderRadius: 9, background: "#7c4dff", border: "none",
    color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    cursor: "pointer", transition: "all .2s", boxShadow: "0 0 24px rgba(124,77,255,.35)",
  },
  wipBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "rgba(255,200,50,.1)", border: "1px solid rgba(255,200,50,.3)",
    borderRadius: 100, padding: "4px 14px", fontSize: 11, color: "#ffd766",
    fontFamily: "'Space Mono', monospace",
  },
  wipDot: {
    width: 5, height: 5, borderRadius: "50%", background: "#ffd766",
    animation: "wip-blink 1.2s infinite",
  },
};

export default function Navbar({ showWip = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>ISABEL</Link>

      <div style={styles.links}>
        <Link to="/" style={{ ...styles.link, ...(isActive("/") ? styles.linkActive : {}) }}>Home</Link>
        <Link to="/chat" style={{ ...styles.link, ...(isActive("/chat") ? styles.linkActive : {}) }}>Chat</Link>
        <Link to="/virtual" style={{ ...styles.link, ...(isActive("/virtual") ? styles.linkActive : {}) }}>Virtual AI</Link>
        {showWip && (
          <div style={styles.wipBadge}>
            <div style={styles.wipDot} />
            Working Progress
          </div>
        )}
      </div>

      <div style={styles.cta}>
        {user ? (
          <>
            <span style={{ ...styles.link, display: "flex", alignItems: "center", fontSize: 13, color: "rgba(232,228,255,.5)" }}>
              {user.name}
            </span>
            <button style={styles.btnGhost} onClick={handleLogout}>Sign Out</button>
          </>
        ) : (
          <>
            <button style={styles.btnGhost} onClick={() => navigate("/login")}>Sign In</button>
            <button style={styles.btnFill} onClick={() => navigate("/register")}>Get Started</button>
          </>
        )}
      </div>
    </nav>
  );
}
