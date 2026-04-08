import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Introduction from "./pages/Introduction.jsx";
import Virtual from "./pages/Virtual.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#07060f" }}><div className="orb-mini-loader" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/chat" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Introduction />} />
      <Route path="/virtual" element={<Virtual />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#0f0d1e", color: "#e8e4ff", border: "1px solid rgba(124,77,255,.25)", fontFamily: "'DM Sans', sans-serif" },
            success: { iconTheme: { primary: "#4cff91", secondary: "#07060f" } },
            error: { iconTheme: { primary: "#ff4d6a", secondary: "#07060f" } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
