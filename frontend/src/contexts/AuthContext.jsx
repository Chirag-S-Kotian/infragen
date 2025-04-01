import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingMessages, setRemainingMessages] = useState(0);
  const [maxMessages, setMaxMessages] = useState(0);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [limitResetTime, setLimitResetTime] = useState(null);

  useEffect(() => {
    if (isLoaded && isUserLoaded) {
      setIsAuthenticated(isSignedIn);
      setIsLoading(false);
      
      if (isSignedIn) {
        fetchUserLimits();
      }
    }
  }, [isLoaded, isUserLoaded, isSignedIn]);

  const getAuthToken = async () => {
    try {
      // Try to get token from Clerk
      const clerkToken = await getToken();
      if (clerkToken) return clerkToken;
      
      // In development, if Clerk token isn't available, generate a test token
      // This is for development only - in production, we would require proper auth
      if (process.env.NODE_ENV === 'development' && isAuthenticated) {
        // Generate a test user ID based on the authenticated user
        const userId = user?.id || 'test-user-123';
        const response = await fetch('http://localhost:8000/test/generate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.token;
        }
      }
      
      console.error('Failed to get auth token');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchUserLimits = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/user/limits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRemainingMessages(data.remaining_messages);
        setMaxMessages(data.max_messages);
        setHasReachedLimit(!data.has_access);
        
        // If user has sent at least one message, calculate when their limit will reset
        if (data.remaining_messages < data.max_messages) {
          // Estimate reset time to be 24 hours from now for simplicity
          // In a production app, the backend would track and return the actual reset time
          const resetTime = new Date();
          resetTime.setHours(resetTime.getHours() + 24);
          setLimitResetTime(resetTime);
        } else {
          setLimitResetTime(null);
        }
      } else {
        console.error('Failed to fetch user limits');
      }
    } catch (error) {
      console.error('Error fetching user limits:', error);
    }
  };

  const updateMessageCount = (remaining) => {
    setRemainingMessages(remaining);
    setHasReachedLimit(remaining <= 0);
    
    // Update reset time if this is the first message
    if (!limitResetTime && remaining < maxMessages) {
      const resetTime = new Date();
      resetTime.setHours(resetTime.getHours() + 24);
      setLimitResetTime(resetTime);
    }
  };

  const value = {
    isLoaded: !isLoading,
    isAuthenticated,
    user,
    signOut,
    getAuthToken,
    remainingMessages,
    maxMessages,
    hasReachedLimit,
    limitResetTime,
    fetchUserLimits,
    updateMessageCount,
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