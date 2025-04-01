import { useState, useEffect, useRef } from "react";
import InfraForm from "./components/InfaForm";
import "./App.css";

const App = () => {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const cursorRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Add a small delay to trigger the fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Handle scroll event for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Handle mouse movement for cursor follower
    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
        
        // Add a subtle opacity change based on movement speed
        const speed = Math.sqrt(Math.pow(e.movementX, 2) + Math.pow(e.movementY, 2));
        cursorRef.current.style.opacity = Math.min(0.5, 0.2 + speed * 0.05);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleGenerate = async (prompt, model) => {
    setLoading(true);
    setError(null);
    setOutput("");
    setCopySuccess(false);

    try {
      const response = await fetch("http://localhost:8000/generate-infra/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      setOutput(data[model] || "No output generated.");
      
      // Scroll to output
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
    } catch (err) {
      console.error("API Call Failed:", err);
      setError("Failed to generate infrastructure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleCopyCode = async () => {
    if (!output) return;
    
    try {
      await navigator.clipboard.writeText(output);
      setCopySuccess(true);
      
      // Reset copy success message after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`app-container ${isVisible ? 'fade-in' : ''}`}>
      {/* Cursor follower animation */}
      <div className="cursor-follower" ref={cursorRef}></div>
      
      {/* Header */}
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          <a href="#" className="logo">
            <span className="logo-icon">⚡</span>
            <span>InfraGen AI</span>
          </a>
          
          <nav className="nav-links">
            <a href="#" className="nav-link">Home</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#infra-form" className="nav-link">Generate</a>
            <a href="#" className="nav-link">Docs</a>
            <a href="#" className="nav-link">Contact</a>
          </nav>
          
          <button className="mobile-nav-toggle" onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className={`mobile-nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <a href="#" className="nav-link" onClick={toggleMobileMenu}>Home</a>
          <a href="#features" className="nav-link" onClick={toggleMobileMenu}>Features</a>
          <a href="#infra-form" className="nav-link" onClick={toggleMobileMenu}>Generate</a>
          <a href="#" className="nav-link" onClick={toggleMobileMenu}>Docs</a>
          <a href="#" className="nav-link" onClick={toggleMobileMenu}>Contact</a>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero">
        <h1 className="hero-title">AI-Powered Infrastructure Generator</h1>
        <p className="hero-subtitle">
          Transform your infrastructure ideas into reality with advanced AI technology.
          Generate cloud infrastructure code instantly with our powerful AI models.
          Experience the future of infrastructure automation.
        </p>
        <a href="#infra-form" className="hero-button">Get Started</a>
      </div>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Why Choose InfraGen AI</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3 className="feature-title">Lightning Fast Generation</h3>
            <p className="feature-description">
              Generate complete infrastructure code in seconds using our advanced AI models.
              No more manual configuration or complex setup required.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">Multiple AI Models</h3>
            <p className="feature-description">
              Choose between powerful AI models like DeepSeek and Gemini to generate
              infrastructure code tailored to your specific needs.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Best Practices</h3>
            <p className="feature-description">
              Get production-ready infrastructure code that follows industry best practices
              and security standards.
            </p>
          </div>
        </div>
      </section>

      {/* Infra Form Section */}
      <section id="infra-form" className="infra-section">
        <InfraForm onGenerate={handleGenerate} />
      </section>

      {/* Loading Animation */}
      {loading && (
        <div className="loading-container fade-in">
          <div className="spinner"></div>
          <p>Generating your infrastructure code...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message fade-in">
          {error}
        </div>
      )}

      {/* Output Section */}
      {output && !loading && (
        <div className="output-container fade-in" ref={outputRef}>
          <div className="output-header">
            <h3>Generated Infrastructure Code</h3>
            <button 
              className="copy-button" 
              onClick={handleCopyCode}
              title="Copy to clipboard"
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>
          <div className="output-content">
            <pre className="output-code">{output}</pre>
          </div>
          <div className="output-actions">
            <button className="action-button">
              <span className="button-icon">💾</span>
              Save as File
            </button>
            <button className="action-button">
              <span className="button-icon">🔄</span>
              Run Another Query
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h4 className="footer-title">InfraGen AI</h4>
            <p>
              The future of infrastructure as code.
              Transforming how teams deploy and manage cloud resources.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">📱</a>
              <a href="#" className="social-link">💻</a>
              <a href="#" className="social-link">📧</a>
            </div>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-title">Resources</h4>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">API Reference</a>
            <a href="#" className="footer-link">Examples</a>
            <a href="#" className="footer-link">Tutorials</a>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-title">Company</h4>
            <a href="#" className="footer-link">About Us</a>
            <a href="#" className="footer-link">Blog</a>
            <a href="#" className="footer-link">Careers</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-title">Legal</h4>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Cookie Policy</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} InfraGen AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;