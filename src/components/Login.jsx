import React, { useState } from "react";
import API from "../services/api";
import "../styles/Login.css";

export default function Login({ setUser, theme, toggleTheme }) {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!form.username || !form.password || loading) {
      if (!form.username || !form.password) alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await API.post("/login", form);
      const res = await API.get("/me");
      setUser(res.data);
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-showcase">
        <div className="login-brand">
          <span>AI</span>
          <strong>Analytics Platform</strong>
        </div>

        <div className="login-copy">
          <p>Business intelligence</p>
          <h1>Ask data questions and reuse trusted answers faster.</h1>
        </div>

        <div className="login-metrics">
          <div>
            <span>20</span>
            <small>recent query patterns</small>
          </div>
          <div>
            <span>2x</span>
            <small>LLM saving paths</small>
          </div>
          <div>
            <span>RBAC</span>
            <small>department access</small>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <div>
              <p>Secure access</p>
              <h2>Welcome back</h2>
            </div>
            <button className="login-theme-toggle" onClick={toggleTheme} type="button">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>

          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              value={form.username}
              className="login-input"
              onChange={(e) => updateForm("username", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              className="login-input"
              onChange={(e) => updateForm("password", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
          </label>

          <button className="login-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in" : "Login"}
          </button>
        </div>
      </section>
    </main>
  );
}
