import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuthContext } from './contexts/AuthContext';
import { AuthButtons } from './components/auth/AuthButtons';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// Main App Component
function AppContent() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedModel, setSelectedModel] = useState('deepseek');
  const [promptValue, setPromptValue] = useState('');
  const [cursorFollowerActive, setCursorFollowerActive] = useState(true);
  const { isAuthenticated, isLoaded } = useAuthContext();

  const navigationLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '#features' },
    { name: 'Generate', href: '#generate' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    const handleMouseMove = (e) => {
      // Don't update cursor position when hovering over any input or form elements
      const target = e.target;
      const isInteractive = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('form') !== null ||
        target.closest('.form-container') !== null;
      
      if (!isInteractive && cursorFollowerActive) {
        // Throttle updates for better performance
        requestAnimationFrame(() => {
          setCursorPosition({ x: e.clientX, y: e.clientY });
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorFollowerActive]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Only allow authenticated users to generate code
    if (!isAuthenticated) {
      setError('Please sign in to generate infrastructure code.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/generate-infra/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: promptValue, 
          model: selectedModel 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate infrastructure code');
      }

      const data = await response.json();
      setOutput(data[selectedModel]);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const resetForm = () => {
    setOutput('');
    setSuccess(false);
    setError('');
  };

  const saveToFile = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infrastructure-code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Infrastructure Generation Form Component - This separates the form for better authentication control
  const InfrastructureForm = () => {
    return (
      <div 
        className="form-container"
        onMouseEnter={() => setCursorFollowerActive(false)}
        onMouseLeave={() => setCursorFollowerActive(true)}
      >
        <h2 className="form-title">Generate Infrastructure Code</h2>
        <form onSubmit={handleGenerate} className="infra-form">
          <div className="form-group">
            <label htmlFor="prompt">
              <span className="label-icon">📝</span>
              Describe your infrastructure
            </label>
            <textarea
              id="prompt"
              name="prompt"
              className="infra-input"
              placeholder="Example: Create a VPC with public and private subnets, NAT Gateway, and security groups for a web application"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="input-footer">
              <div className="textarea-info">
                Be specific about your requirements, including region, environment, and any specific configurations.
              </div>
              <div className="char-count">
                {promptValue.length}/1000
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="model">
              <span className="label-icon">🤖</span>
              Select AI Model
            </label>
            <div className="select-wrapper">
              <select 
                id="model" 
                name="model" 
                className="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                required
              >
                <option value="deepseek">DeepSeek AI (Best for Complex Infrastructure)</option>
                <option value="gemini">Gemini AI (Fast & Reliable)</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
            <div className="model-info">
              <div 
                className={`model-badge ${selectedModel === 'deepseek' ? 'active' : ''}`} 
                onClick={() => setSelectedModel('deepseek')}
              >
                <span className="model-icon">🧠</span>
                <div className="model-details">
                  <div className="model-name">DeepSeek AI</div>
                  <div className="model-description">Optimized for complex infrastructure</div>
                </div>
              </div>
              <div 
                className={`model-badge ${selectedModel === 'gemini' ? 'active' : ''}`}
                onClick={() => setSelectedModel('gemini')}
              >
                <span className="model-icon">💫</span>
                <div className="model-details">
                  <div className="model-name">Gemini AI</div>
                  <div className="model-description">Fast and reliable for general use</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="button-icon">⚡</span>
                Generate Code
              </>
            )}
          </button>
        </form>
      </div>
    );
  };

  // Authentication Required View for Generation Section
  const AuthRequiredView = () => {
    return (
      <div className="auth-required-container">
        <div className="auth-required-content">
          <h2>Authentication Required</h2>
          <p>Please sign in or create an account to generate infrastructure code. Our AI-powered code generation is exclusively available to registered users.</p>
          <div className="auth-required-buttons">
            <AuthButtons />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {cursorFollowerActive && (
        <div 
          className="cursor-follower"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
          }}
        />
      )}

      <header className={`header ${scrollPosition > 50 ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-icon">⚡</span>
            InfraGen AI
          </a>
          <nav className="nav-links">
            {navigationLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <AuthButtons />
          </nav>
          <button className="mobile-nav-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <main>
              <section className="hero">
                <h1 className="hero-title">Generate Infrastructure Code with AI</h1>
                <p className="hero-subtitle">
                  Transform your infrastructure requirements into production-ready code using advanced AI models.
                  Support for AWS, Azure, GCP, and more.
                </p>
                <button className="hero-button" onClick={() => {
                  const formElement = document.getElementById('generate');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}>
                  Start Generating
                </button>
              </section>

              <section id="features" className="features-section">
                <h2 className="section-title">Features</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3 className="feature-title">AI-Powered Generation</h3>
                    <p className="feature-description">
                      Leverage advanced AI models to generate accurate and efficient infrastructure code.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🛡️</div>
                    <h3 className="feature-title">Best Practices</h3>
                    <p className="feature-description">
                      Follow industry best practices and security standards in generated code.
                    </p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">🔄</div>
                    <h3 className="feature-title">Multi-Cloud Support</h3>
                    <p className="feature-description">
                      Generate code for multiple cloud providers including AWS, Azure, and GCP.
                    </p>
                  </div>
                </div>
              </section>

              <section id="generate" className="infra-section">
                {isLoaded ? (
                  isAuthenticated ? (
                    <InfrastructureForm />
                  ) : (
                    <AuthRequiredView />
                  )
                ) : (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading authentication...</p>
                  </div>
                )}
              </section>

              {/* Only show output section for authenticated users */}
              {output && isAuthenticated && (
                <section className="output-section">
                  <div className="output-container">
                    <div className="output-header">
                      <h3>Generated Infrastructure Code</h3>
                      <button
                        className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
                        onClick={copyToClipboard}
                      >
                        <span className="button-icon">
                          {copySuccess ? '✓' : '📋'}
                        </span>
                        {copySuccess ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="output-content">
                      <pre className="output-code">{output}</pre>
                      <button className="floating-copy-button" onClick={copyToClipboard}>
                        📋
                      </button>
                    </div>
                    <div className="output-actions">
                      <button className="action-button save-button" onClick={saveToFile}>
                        <span className="button-icon">💾</span>
                        Save to File
                      </button>
                      <button className="action-button run-another-button" onClick={resetForm}>
                        <span className="button-icon">🔄</span>
                        Generate Another
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Show errors to all users */}
              {error && (
                <div className="error-message" data-success="false">
                  {error}
                </div>
              )}

              {/* Only show success message to authenticated users */}
              {success && isAuthenticated && (
                <div className="error-message" data-success="true">
                  Code generated successfully!
                </div>
              )}
            </main>
          }
        />
      </Routes>
    </div>
  );
}

// Root App Component
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}