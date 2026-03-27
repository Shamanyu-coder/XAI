import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiActivity, FiVideo } from "react-icons/fi";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="auth-page auth-bg-animated" style={{ padding: '0', justifyContent: 'flex-start' }}>
      
      {/* Top Navbar */}
      <header style={{ width: '100%', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>
          <span style={{ color: '#2ecc71' }}>Yoga</span>pathy
        </div>
        <nav style={{ display: 'flex', gap: '15px' }}>
          <Link to="/login" className="glass-btn" style={{ padding: '8px 20px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Login</Link>
          <Link to="/register" className="glass-btn primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Get Started</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ width: '100%', maxWidth: '1200px', padding: '80px 20px', display: 'flex', flexDirection: 'column', gap: '60px', margin: '0 auto' }}>
        
        {/* Hero Section */}
        <section className="fade-in-up" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div className="auth-header">
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '20px', background: 'linear-gradient(to right, #ffffff, #2ecc71)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Personalized Yoga.<br/>Better Habits. Real Progress.
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
              Take a quick assessment, get AI-recommended poses, and perfect your form with real-time geometric coaching.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
            <button onClick={() => navigate("/assessment")} className="glass-btn primary" style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
              Start Assessment <FiArrowRight />
            </button>
            <button onClick={() => navigate("/benefits")} className="glass-btn" style={{ padding: '15px 30px', fontSize: '1.1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              Explore Benefits
            </button>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="recommendation-grid" style={{ marginTop: '20px' }}>
          <div className="glass-card fade-in-up" style={{ animationDelay: '0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
            <FiCheckCircle size={40} color="#2ecc71" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>Smart Assessment</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>Answer a few quick health questions to generate a highly personalized daily yoga routine.</p>
          </div>

          <div className="glass-card fade-in-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
            <FiActivity size={40} color="#f39c12" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>AI Medical Maps</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>Access a massive diagnostic library linking your specific ailments to tested yoga cures.</p>
          </div>

          <div className="glass-card fade-in-up" style={{ animationDelay: '0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px' }}>
            <FiVideo size={40} color="#3498db" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>Live Form Coaching</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>Get pinpoint geometric feedback telling you exactly which limbs to bend or straighten.</p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ width: '100%', padding: '30px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', marginTop: 'auto' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          Ready to begin? <Link to="/register" style={{ color: '#2ecc71', fontWeight: 'bold', textDecoration: 'none' }}>Create an account</Link>
        </p>
      </footer>

    </div>
  );
}
