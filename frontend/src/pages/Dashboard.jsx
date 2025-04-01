import { useUser } from "@clerk/clerk-react";
import { useAuthContext } from "../contexts/AuthContext";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useUser();
  const { 
    remainingMessages, 
    maxMessages, 
    hasReachedLimit, 
    limitResetTime,
    fetchUserLimits 
  } = useAuthContext();

  useEffect(() => {
    fetchUserLimits();
  }, [fetchUserLimits]);

  const usedMessages = maxMessages - remainingMessages;
  const usagePercentage = (usedMessages / maxMessages) * 100;

  // Format limit reset time
  const formatResetTime = () => {
    if (!limitResetTime) return null;
    
    const now = new Date();
    const diffMs = limitResetTime - now;
    
    // If less than 0, the limit has reset
    if (diffMs <= 0) return "now";
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `in ${diffHrs} hour${diffHrs !== 1 ? 's' : ''} and ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else {
      return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p>Manage your infrastructure code and templates</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Usage Limits</h2>
            <div className="usage-stats">
              <div className="usage-header">
                <span>Daily Message Limit</span>
                <span className="usage-count">{usedMessages} of {maxMessages} used</span>
              </div>
              <div className="usage-bar">
                <div 
                  className="usage-progress" 
                  style={{ 
                    width: `${usagePercentage}%`,
                    backgroundColor: hasReachedLimit ? '#ef4444' : '#38bdf8'
                  }}
                ></div>
              </div>
              <div className="usage-info">
                {hasReachedLimit ? (
                  <p className="usage-warning">You've reached your daily limit. Limit resets {formatResetTime()}.</p>
                ) : usedMessages > 0 ? (
                  <p>You have {remainingMessages} messages remaining today. Limit resets {formatResetTime()}.</p>
                ) : (
                  <p>You have {remainingMessages} messages available today.</p>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Recent Generations</h2>
            <div className="generations-list">
              <p>No recent generations</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Saved Templates</h2>
            <div className="templates-list">
              <p>No saved templates</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Quick Actions</h2>
            <div className="actions-list">
              <button 
                className="dashboard-button"
                disabled={hasReachedLimit}
                onClick={() => window.location.href = '/#generate'}
              >
                New Generation
              </button>
              <button className="dashboard-button">Create Template</button>
              <button className="dashboard-button">View History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 