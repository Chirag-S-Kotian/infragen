import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join InfraGen AI to start generating infrastructure code</p>
        </div>
        <div className="auth-content">
          <SignUp 
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
            afterSignUpUrl="/dashboard"
            signInUrl="/login"
          />
        </div>
        <div className="auth-footer">
          <p>Already have an account? <button onClick={() => navigate('/login')} className="auth-link">Sign in</button></p>
        </div>
      </div>
    </div>
  );
} 