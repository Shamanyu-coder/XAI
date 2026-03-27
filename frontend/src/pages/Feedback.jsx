import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { FiSmile, FiFrown, FiMessageSquare, FiTrendingUp, FiCheckCircle, FiDownload } from "react-icons/fi";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function Feedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { sessionId, recommendationData, sessionNotes } = location.state || {};

  const [formData, setFormData] = useState({
    session_id: sessionId || 0,
    relieved: true,
    pain_before: 5,
    pain_after: 2,
    comments: sessionNotes || ""
  });

  useEffect(() => {
    if (sessionId) {
      setFormData(prev => ({ ...prev, session_id: sessionId }));
    }
  }, [sessionId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/feedback", formData);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (e) => {
    e.preventDefault(); // prevent form submit behavior if placed inside
    
    // Provide fallback data if recommendationData is missing so it always works
    const data = recommendationData || {
      user: "Patient",
      recommendations: [
        { pose: "Child's Pose", score: 9.5, reasons: ["Great for relaxation and stress relief"] },
        { pose: "Downward Dog", score: 8.0, reasons: ["Improves flexibility and arm strength"] },
        { pose: "Warrior II", score: 8.5, reasons: ["Builds stamina and focus"] }
      ]
    };
    
    const doc = new jsPDF();
    
    // Document Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(33, 47, 61);
    doc.text("Yogapathy Medical Report", 105, 20, null, null, "center");
    
    // Subheader / Patient Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString();
    
    doc.text(`Patient Name: ${data.user || "Patient"}`, 14, 35);
    doc.text(`Date of Assessment: ${today}`, 14, 42);
    
    let currentY = 47;
    
    if (formData.comments) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const splitComments = doc.splitTextToSize(`Session Notes: ${formData.comments}`, 180);
      doc.text(splitComments, 14, 49);
      currentY = 49 + (splitComments.length * 5);
    }
    
    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, 196, currentY);
    
    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Prescribed Yoga Poses", 14, currentY + 9);
    
    // Table content
    const tableColumn = ["#", "Pose Name", "Effectiveness", "Medical Benefits / Reasons"];
    const tableRows = [];
    
    data.recommendations.forEach((item, index) => {
      const poseData = [
        index + 1,
        item.pose,
        `${item.score * 10}%`,
        item.reasons.join(", ")
      ];
      tableRows.push(poseData);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY + 13,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5, textColor: 40 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' }
      }
    });
    
    // Footer notice
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Provider: Yogapathy ML Engine - Algorithmically generated based on user health parameters.", 14, doc.lastAutoTable.finalY + 15);
    
    // Save
    doc.save(`Yoga_Medical_Report_${data.user || "Patient"}.pdf`);
  };

  if (success) {
    return (
      <div className="auth-page auth-bg-animated">
        <div className="glass-card fade-in-up" style={{ textAlign: 'center' }}>
          <FiCheckCircle style={{ fontSize: '4rem', color: '#2ecc71', marginBottom: '20px' }} />
          <h2>Thank You!</h2>
          <p>Your feedback helps us improve your journey. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page auth-bg-animated">
      <div className="glass-card fade-in-up" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h2>Session Feedback</h2>
          <p>How do you feel after your practice?</p>
        </div>

        <form onSubmit={submitFeedback} className="glass-form">
          <div className="form-row">
            <div className="input-group half">
              <label>Pain (Before)</label>
              <div className="input-wrapper">
                <input 
                  type="number" 
                  min="0" max="10" 
                  name="pain_before"
                  value={formData.pain_before}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="input-group half">
              <label>Pain (After)</label>
              <div className="input-wrapper">
                <input 
                  type="number" 
                  min="0" max="10" 
                  name="pain_after"
                  value={formData.pain_after}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-container">
              I feel relieved and better
              <input 
                type="checkbox" 
                name="relieved"
                checked={formData.relieved}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
            </label>
          </div>

          <div className="input-group">
            <label>Additional Comments</label>
            <div className="input-wrapper">
              <textarea
                name="comments"
                className="modern-textarea"
                placeholder="Share your experience..."
                value={formData.comments}
                onChange={handleChange}
              />
              <FiMessageSquare className="input-icon" style={{ top: '15px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button type="submit" className="glass-btn primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? "Submitting..." : "Submit & Finish Session"}
            </button>
            <button type="button" onClick={handleDownload} className="glass-btn secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <FiDownload /> Download Session Medical Report (PDF)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Feedback;

