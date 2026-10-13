import { BookOpen, Sparkles, ArrowRight, RefreshCw } from "lucide-react";

function Hero({ onNavigate }) {
  return (
    <div className="hero-glass-card">
      <div className="hero-eyebrow-pill">
        <Sparkles size={14} />
        LIBRARY MANAGEMENT SYSTEM
      </div>

      <h1 className="hero-title-large">
        Manage Your Library <br />
        <span className="text-white-glow">Smarter &amp; Faster</span>
      </h1>

      <p className="hero-desc-centered">
        Organize books, track circulation, and manage library records from one modern glassmorphism platform.
      </p>

      <div className="hero-actions-centered">
        <button className="btn-glass-primary" onClick={() => onNavigate("books")}>
          <BookOpen size={18} />
          Browse Books
          <ArrowRight size={16} />
        </button>
        <button className="btn-glass-secondary" onClick={() => onNavigate("circulation")}>
          <RefreshCw size={18} />
          Manage Circulation
        </button>
      </div>
    </div>
  );
}

export default Hero;
