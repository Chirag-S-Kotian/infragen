import { SignInButton, SignUpButton, useAuth } from '@clerk/clerk-react';
import { useAuthContext } from '../../contexts/AuthContext';

export function AuthButtons() {
  const { isSignedIn, signOut } = useAuth();
  const { isAuthenticated, isLoaded } = useAuthContext();

  if (!isLoaded) {
    return (
      <div className="auth-buttons">
        <div className="auth-button loading">
          <span className="button-spinner"></span>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-buttons">
        <SignInButton mode="modal">
          <button className="auth-button sign-in">
            <span className="button-icon">🔑</span>
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="auth-button sign-up">
            <span className="button-icon">✨</span>
            Sign Up
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <button className="auth-button sign-out" onClick={() => signOut()}>
      <span className="button-icon">🚪</span>
      Sign Out
    </button>
  );
} 