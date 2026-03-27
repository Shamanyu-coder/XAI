import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FiActivity, FiEdit3, FiCheckCircle, FiAlertCircle, FiChevronRight } from "react-icons/fi";

function Assessment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    issue_type: "General Wellness",
    issue_description: "",
    has_injury: false,
    injury_description: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const submitAssessment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await API.post("/health-profile", formData);
      navigate("/recommendation");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-bg-animated">
      <div className="glass-card assessment-container fade-in-up">
        <div className="auth-header">
          <h2>Health Assessment</h2>
          <p>Tell us about your physical condition for personalized yoga.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submitAssessment} className="glass-form">
          <div className="input-group">
            <label>Primary Focus / Ailment</label>
            <div className="input-wrapper">
              <select 
                name="issue_type" 
                value={formData.issue_type} 
                onChange={handleChange}
                required
              >
                <option value="General Wellness">General Wellness</option>
                <option value="Back Pain">Back Pain / Backache</option>
                <option value="Neck Pain">Neck Pain / Stiffness</option>
                <option value="Sciatica">Sciatica</option>
                <option value="Stress">Stress & Anxiety</option>
                <option value="Fatigue">Fatigue / Low Energy</option>
                <option value="Asthma">Asthma / Breathing Issues</option>
                <option value="Headache">Headache / Migraine</option>
                <option value="Insomnia">Insomnia / Sleep Issues</option>
                <option value="Digestion">Digestion Issues / Constipation</option>
                <option value="Flat feet">Flat feet</option>
                <option value="Menstrual">Menstrual discomfort</option>
                <option value="Posture">Poor Posture</option>
                <option value="Arthritis">Arthritis / Joint stiffness</option>
                <option value="Osteoporosis">Osteoporosis</option>
                <option value="Flexibility">Flexibility</option>
                <option value="Strength Building">Strength Building</option>
              </select>
              <FiActivity className="input-icon" />
            </div>
          </div>

          <div className="input-group">
            <label>Detailed Description</label>
            <div className="input-wrapper">
              <textarea
                name="issue_description"
                className="text-area"
                placeholder="Describe your current condition or goals..."
                value={formData.issue_description}
                onChange={handleChange}
                required
              />
              <FiEdit3 className="input-icon" style={{ top: '15px' }} />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-container">
              I have a physical injury
              <input 
                type="checkbox" 
                name="has_injury" 
                checked={formData.has_injury} 
                onChange={handleChange}
              />
              <span className="checkmark"></span>
            </label>
          </div>

          {formData.has_injury && (
            <div className="input-group fade-in-up" style={{ animationDuration: '0.3s' }}>
              <label>Injury Details</label>
              <div className="input-wrapper">
                <textarea
                  name="injury_description"
                  className="text-area"
                  placeholder="Please specify your injury..."
                  value={formData.injury_description}
                  onChange={handleChange}
                  required={formData.has_injury}
                />
                <FiAlertCircle className="input-icon" style={{ top: '15px' }} />
              </div>
            </div>
          )}

          <button type="submit" className="glass-btn primary mt-3" disabled={loading}>
            {loading ? "Submitting..." : (
              <>
                Analyze & Get Recommendations
                <FiChevronRight className="btn-icon" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Assessment;

