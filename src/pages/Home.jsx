import "../styles/Home.css";
import React, { useEffect, useState } from "react";
import API from "../services/api";
import Login from "../components/Login";
import Chat from "../components/Chat";
import AdminPanel from "../components/AdminPanel";
import WalkThrough from "../components/WalkThrough";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    API.get("/me")
      .then((res) => {
        if (!res.data.error) setUser(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-card">
          <span />
          <p>Loading dashboard</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login setUser={setUser} theme={theme} toggleTheme={toggleTheme} />;

  const logout = () => {
    document.cookie = "session_id=; Max-Age=0";
    setUser(null);
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div>
          <div className="logo-block">
            <span>AI</span>
            <div>
              <h2 className="logo">Analytics</h2>
              <p>Data command center</p>
            </div>
          </div>

          <nav className="menu">
            <button
              className={activeTab === "chat" ? "active" : ""}
              onClick={() => setActiveTab("chat")}
            >
              <span>Chat</span>
              <small>Ask and analyze</small>
            </button>

            <button
              className={activeTab === "walkthrough" ? "active" : ""}
              onClick={() => setActiveTab("walkthrough")}
            >
              <span>Walk Through</span>
              <small>Analytics builder</small>
            </button>

            {user.role === "admin" && (
              <button
                className={activeTab === "admin" ? "active" : ""}
                onClick={() => setActiveTab("admin")}
              >
                <span>Admin</span>
                <small>Manage access</small>
              </button>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{user.username?.slice(0, 1)?.toUpperCase() || "U"}</span>
            <div>
              <strong>{user.username}</strong>
              <small>{user.department || user.role}</small>
            </div>
          </div>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p>
              {activeTab === "chat" ? "AI Chat Assistant" :
               activeTab === "walkthrough" ? "Analytics Builder" :
               "Admin Panel"}
            </p>
            <h1>
              {activeTab === "chat" ? "Analytics Assistant" :
               activeTab === "walkthrough" ? "Walk Through Analytics" :
               "User Management"}
            </h1>
          </div>
          <div className="topbar-badges">
            <button className="theme-toggle" onClick={toggleTheme} type="button">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <span>{user.role}</span>
            {user.department && <span>{user.department}</span>}
          </div>
        </header>

        <section className="content">
          {activeTab === "chat" && <Chat />}
          {activeTab === "walkthrough" && <WalkThrough />}
          {activeTab === "admin" && user.role === "admin" && <AdminPanel />}
        </section>
      </main>
    </div>
  );
}
