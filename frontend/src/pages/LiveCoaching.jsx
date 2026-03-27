import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiCamera, FiEdit3, FiInfo, FiLayers, FiLogOut, FiSave } from "react-icons/fi";
import API from "../services/api";

export default function LiveCoaching() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { sessionId, poseName, recommendationData } = location.state || {};

  const [cameraError, setCameraError] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [accuracy, setAccuracy] = useState(89);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    // Timer interval
    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // AI Prediction interval
    const aiInterval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !poseName) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 224;
        canvas.height = video.videoHeight || 224;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 jpeg
        const base64Image = canvas.toDataURL("image/jpeg", 0.7);
        
        try {
          const res = await API.post("/predict-pose", {
            image_b64: base64Image,
            expected_pose: poseName
          });
          if (res.data && typeof res.data.accuracy === 'number') {
            setAccuracy(res.data.accuracy);
            if (res.data.feedback) {
              setFeedbackMsg(res.data.feedback);
            }
          }
        } catch (err) {
          console.error("AI prediction error:", err);
        }
      }
    }, 500); // 500 ms per frame sent

    return () => {
      clearInterval(timerInterval);
      clearInterval(aiInterval);
    };
  }, [poseName]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError("Camera access denied.");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  async function handleSaveNotes() {
    if (!sessionId) {
      alert("Session ID missing. Start a session from recommendations.");
      return;
    }
    try {
      await API.post("/feedback", {
        session_id: sessionId,
        relieved: true,
        pain_before: 0,
        pain_after: 0,
        comments: sessionNotes,
      });
      alert("Progress saved to database!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save progress.");
    }
  }

  const poseImageSrc = poseName ? `http://localhost:8000/pose-image/${encodeURIComponent(poseName)}` : `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=300&h=200`;

  // Dynamic accuracy color
  const getAccuracyColor = (acc) => {
    if (acc >= 90) return '#2ecc71'; // Green
    if (acc >= 70) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  return (
    <div className="auth-page auth-bg-animated" style={{ padding: '20px', justifyContent: 'flex-start', overflowY: 'auto' }}>
      <div className="recommendation-grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px', maxWidth: '1400px' }}>
        
        {/* Left Column: Video & Reference */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-card fade-in-up" style={{ padding: '20px', position: 'relative' }}>
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiCamera style={{ color: '#2ecc71' }} /> Live AI Coach
              </h2>
            </div>
            
            {/* Split View for Reference and Camera */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* Reference Image */}
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '20px', color: '#fff', zIndex: 2, fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Target Pose: {poseName || "Yoga Flow"}
                </div>
                <img 
                  src={poseImageSrc} 
                  alt={poseName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px', border: '2px solid rgba(255,255,255,0.1)' }}
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=400"; }}
                />
              </div>

              {/* Live Camera */}
              <div style={{ flex: '1 1 300px', position: 'relative', borderRadius: '15px', overflow: 'hidden', border: `3px solid ${getAccuracyColor(accuracy)}`, transition: 'border-color 0.3s ease' }}>
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px 15px', borderRadius: '20px', color: '#fff', zIndex: 2, fontSize: '0.9rem', fontWeight: 'bold' }}>
                  Your Camera
                </div>
                
                {/* BIG PROMINENT ACCURACY OVERLAY */}
                <div style={{ 
                  position: 'absolute', top: '10px', right: '10px', 
                  background: getAccuracyColor(accuracy), padding: '10px 20px', 
                  borderRadius: '30px', color: '#fff', zIndex: 2, 
                  fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  Accuracy: {accuracy}%
                </div>
                
                {feedbackMsg && (
                  <div style={{ 
                    position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(255,255,255,0.95)', padding: '10px 20px', width: '90%',
                    borderRadius: '15px', color: '#111827', zIndex: 2, 
                    fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}>
                    🤖 AI Coach: {feedbackMsg}
                  </div>
                )}

                {cameraError ? (
                  <div style={{ height: '300px', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                    <FiInfo size={40} color="#e74c3c" />
                    <p style={{ marginTop: '10px' }}>Camera Access Denied</p>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </>
                )}
              </div>

            </div>

            <div className="session-info-card" style={{ marginTop: '20px' }}>
              <div className="session-stat">
                <label>Time Elapsed</label>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatTime(elapsedSeconds)} / 30:00</span>
              </div>
              <div className="session-stat">
                <label>Status</label>
                <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Active tracking...</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Notes & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {(() => {
            const currentRec = recommendationData?.recommendations?.find(r => r.pose === poseName);
            if (currentRec && currentRec.benefits && currentRec.benefits.length > 0) {
              return (
                <div className="glass-card fade-in-up" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#2ecc71' }}>✨ Exercise Benefits</h2>
                  <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {currentRec.benefits.map((b, i) => <li key={i} style={{ marginBottom: '5px' }}>{b}</li>)}
                  </ul>
                </div>
              );
            }
            return null;
          })()}

          <div className="glass-card fade-in-up" style={{ padding: '20px', flex: 1 }}>
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiEdit3 style={{ color: '#2ecc71' }} /> Practice Notes
              </h2>
            </div>
            <textarea
              className="modern-textarea"
              style={{ flex: 1, minHeight: '300px' }}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you learn today? Any physical sensations?"
            />
            <button 
              className="glass-btn primary mt-3" 
              style={{ width: '100%' }}
              onClick={handleSaveNotes}
            >
              <FiSave /> Save Session Progress
            </button>
          </div>

          <div className="glass-card fade-in-up" style={{ padding: '20px' }}>
            <button 
              onClick={() => navigate("/feedback", { state: { sessionId: sessionId, recommendationData: recommendationData, sessionNotes: sessionNotes } })} 
              className="glass-btn" 
              style={{ width: '100%', background: 'rgba(231, 76, 60, 0.2)', color: '#ff7675', border: '1px solid rgba(231, 76, 60, 0.4)' }}
            >
              <FiLogOut /> End Session
            </button>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '10px' }}>
              Ending will redirect you to the feedback page.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

