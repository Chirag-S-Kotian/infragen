import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isUserLoaded) {
      setIsAuthenticated(isSignedIn);
      setIsLoading(false);
    }
  }, [isLoaded, isUserLoaded, isSignedIn]);

  const getAuthToken = async () => {
    try {
      const token = await getToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    isLoaded: !isLoading,
    isAuthenticated,
    user,
    signOut,
    getAuthToken,
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 