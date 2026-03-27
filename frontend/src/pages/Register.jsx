import React, { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiCalendar, FiArrowRight } from "react-icons/fi";
import { BsGenderAmbiguous } from "react-icons/bs";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "Male",
    yoga_experience: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    // Convert age to number for API
    const submissionData = { ...formData, age: Number(formData.age) };

    try {
      await API.post("/register", submissionData);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-bg-animated">
      <div className="glass-card register-card fade-in-up">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join us to start your yogapathy journey</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleRegister} className="glass-form">
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group half">
              <label>Age</label>
              <div className="input-wrapper">
                <FiCalendar className="input-icon" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  required
                  min={10}
                  max={120}
                />
              </div>
            </div>

            <div className="input-group half">
              <label>Gender</label>
              <div className="input-wrapper">
                <BsGenderAmbiguous className="input-icon" />
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="yoga_experience"
                checked={formData.yoga_experience}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              I have previous yoga experience
            </label>
          </div>

          <button type="submit" className="glass-btn primary mt-3" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
            {!loading && <FiArrowRight className="btn-icon" />}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
