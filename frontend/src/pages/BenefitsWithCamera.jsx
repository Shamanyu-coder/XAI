import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiActivity, FiArrowRight, FiCamera, FiCheck, FiHeart, FiLock, FiStar, FiZap } from "react-icons/fi";
import API from "../services/api";

export default function BenefitsWithCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [cameraError, setCameraError] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [detectedPose, setDetectedPose] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [ailments, setAilments] = useState([]);

  useEffect(() => {
    API.get("/all-ailments").then(res => setAilments(res.data)).catch(err => console.error(err));
    
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Camera access denied.");
      }
    }

    startCamera();

    const aiInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 224;
        canvas.height = video.videoHeight || 224;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL("image/jpeg", 0.7);
        
        try {
          const res = await API.post("/predict-pose", {
            image_b64: base64Image,
            expected_pose: "Yoga" 
          });
          if (res.data && typeof res.data.accuracy === 'number') {
            setAccuracy(res.data.accuracy);
            setDetectedPose(res.data.detected_pose || "Unknown");
            if (res.data.all_predictions) {
              setPredictions(res.data.all_predictions.slice(0, 5));
            }
          }
        } catch (err) {
          console.error("AI prediction error:", err);
        }
      }
    }, 500);

    return () => {
      clearInterval(aiInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const getAccuracyColor = (acc) => {
    if (acc >= 90) return '#2ecc71';
    if (acc >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const benefits = [
    { icon: <FiHeart />, title: "Holistic Health", text: "Physical strength meets mental clarity." },
    { icon: <FiZap />, title: "Instant Feedback", text: "AI-driven pose correction in real time." },
    { icon: <FiStar />, title: "Personalized Path", text: "Tailored routines for your unique body." },
    { icon: <FiLock />, title: "Secure & Private", text: "Your data is encrypted and safe." },
    { icon: <FiActivity />, title: "Progress Tracking", text: "Watch your evolution with deep analytics." },
  ];

  return (
    <div className="auth-page auth-bg-animated" style={{ padding: '20px', justifyContent: 'flex-start' }}>
      <div className="recommendation-grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '30px', maxWidth: '1200px', marginTop: '40px' }}>
        
        {/* Left: Benefits List */}
        <div className="fade-in-up">
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.5rem' }}>Experience the Power of Yoga</h2>
            <p>Master your practice with AI-guided assistance.</p>
          </div>

          <div className="benefits-grid">
            {benefits.map((b, idx) => (
              <div key={idx} className="benefit-item-modern">
                <div className="benefit-icon-box">{b.icon}</div>
                <div className="benefit-content-modern">
                  <h4>{b.title}</h4>
                  <p>{b.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
            <button onClick={() => navigate("/assessment")} className="glass-btn primary" style={{ flex: 1 }}>
              Start Assessment <FiArrowRight />
            </button>
          </div>
        </div>

        {/* Right: Camera Preview & CTA */}
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiCamera style={{ color: '#2ecc71' }} /> Camera Preview
              </h2>
            </div>
            <div className="glass-camera-container" style={{ position: 'relative' }}>
              {cameraError ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                  <p>Check camera permissions</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="glass-camera-video" style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {accuracy !== null && (
                    <div style={{
                      position: 'absolute', top: '15px', right: '15px',
                      background: 'rgba(0,0,0,0.75)', padding: '15px',
                      borderRadius: '15px', color: '#fff', zIndex: 10,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      display: 'flex', flexDirection: 'column', minWidth: '220px'
                    }}>
                      <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: getAccuracyColor(accuracy) }}>Acc: {accuracy}%</span>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{detectedPose !== "Unknown" ? detectedPose : "Detecting..."}</div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>Top Predictions:</div>
                      {predictions.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }} title={p.pose}>{p.pose}</span>
                          <span style={{ fontWeight: 'bold', color: getAccuracyColor(p.accuracy) }}>{p.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <p style={{ marginTop: '15px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              AI tracking will automatically calibrate once you start your first session.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '25px', background: 'rgba(46, 204, 113, 0.1)' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Ready to Begin?</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>
              Join thousands of practitioners who have improved their lives through mindful yoga.
            </p>
            <button onClick={() => navigate("/register")} className="glass-btn" style={{ width: '100%', background: '#fff', color: '#2ecc71' }}>
              Create Your Account
            </button>
          </div>
        </div>

      </div>
      
      {/* Ailments Section */}
      {ailments.length > 0 && (
        <div className="fade-in-up" style={{ maxWidth: '1200px', width: '100%', marginTop: '50px' }}>
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '2rem' }}>Comprehensive Illness & Yoga Guide</h2>
            <p>Discover which poses are scientifically proven to treat specific conditions.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {ailments.map((ailItem, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.7)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#111827', borderBottom: '2px solid #2ecc71', paddingBottom: '10px', display: 'inline-block' }}>
                  {ailItem.illness}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {ailItem.poses.map((p, pIdx) => (
                    <li key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#2c3e50', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={p.pose}>{p.pose}</span>
                      <span style={{ color: p.effectiveness >= 90 ? '#2ecc71' : '#f39c12', fontWeight: 'bold', marginLeft: '10px' }}>{p.effectiveness}% Effective</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}

