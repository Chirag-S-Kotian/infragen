import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your InfraGen AI account</p>
        </div>
        <div className="auth-content">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "auth-form",
                card: "auth-card",
                headerTitle: "auth-title",
                headerSubtitle: "auth-subtitle",
                socialButtonsBlockButton: "social-button",
                formButtonPrimary: "primary-button",
                formFieldLabel: "form-label",
                formFieldInput: "form-input",
                footerActionLink: "auth-link"
              }
            }}
            afterSignInUrl="/dashboard"
            signUpUrl="/register"
          />
        </div>
        <div className="auth-footer">
          <p>Don't have an account? <button onClick={() => navigate('/register')} className="auth-link">Sign up</button></p>
        </div>
      </div>
    </div>
  );
} 