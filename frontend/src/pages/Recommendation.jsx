import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FiCheckCircle, FiInfo, FiPlayCircle, FiLoader, FiAlertTriangle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function Recommendation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [startingPose, setStartingPose] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await API.post("/recommend-yoga");
        setData(res.data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations. Please ensure your assessment is complete.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const startPose = async (poseName) => {
    setStartingPose(poseName);
    try {
      const res = await API.post("/yoga-session", {
        pose_name: poseName,
        duration_seconds: 1800,
        avg_confidence: 0.0
      });
      navigate("/livecoaching", { state: { sessionId: res.data.id, poseName: poseName, recommendationData: data } });
    } catch (err) {
      console.error("Error starting session:", err);
      navigate("/livecoaching", { state: { poseName: poseName, recommendationData: data } });
    } finally {
      setStartingPose(null);
    }
  };

  if (loading) {
    return (
      <div className="auth-page auth-bg-animated">
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: 'white', fontSize: '1.2rem' }}>Personalizing your yoga plan...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="auth-page auth-bg-animated">
        <div className="glass-card fade-in-up" style={{ textAlign: 'center' }}>
          <FiAlertTriangle style={{ fontSize: '3rem', color: '#f39c12', marginBottom: '20px' }} />
          <h2>No Recommendations Found</h2>
          <p style={{ margin: '15px 0' }}>{error || "We couldn't find any specific poses based on your assessment."}</p>
          <button onClick={() => navigate("/assessment")} className="glass-btn primary">
            Redo Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-bg-animated" style={{ justifyContent: 'flex-start' }}>
      <div className="auth-header fade-in-up">
        <h2>Recommended for {data.user}</h2>
        <p>Based on your assessment, these poses will help you the most.</p>
      </div>

      <div className="recommendation-grid fade-in-up">
        {data.recommendations.map((item, index) => (
          <div 
            key={index} 
            className="recommend-card" 
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="score-badge">Effectiveness: {item.score * 10}%</div>
            <h3>{item.pose}</h3>
            
            <ul className="recommend-reasons">
              {item.reasons.map((reason, ridx) => (
                <li key={ridx} className="reason-tag">
                  <FiCheckCircle style={{ marginRight: '5px', color: '#2ecc71', fontSize: '0.8rem' }} />
                  {reason}
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => startPose(item.pose)}
                className="glass-btn primary" 
                style={{ flex: 1, padding: '10px' }}
                disabled={startingPose === item.pose}
              >
                {startingPose === item.pose ? <FiLoader className="spin" /> : <><FiPlayCircle /> Start</>}
              </button>
              <button className="glass-btn" style={{ padding: '10px', background: 'rgba(255,255,255,0.1)' }}>
                <FiInfo />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="auth-footer fade-in-up" style={{ marginTop: '40px' }}>
        <p>Not satisfied? <button onClick={() => navigate("/assessment")} className="auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Update your profile</button></p>
      </div>
    </div>
  );
}

export default Recommendation;

