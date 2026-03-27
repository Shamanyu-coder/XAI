import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.post("/login", { email, password });
      if (res.data && res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        navigate("/assessment");
      } else {
        setErrorMsg("Login successful but no token received.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-bg-animated">
      <div className="glass-card fade-in-up">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to continue your wellness journey</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="glass-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="glass-btn primary" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
            {!loading && <FiArrowRight className="btn-icon" />}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
