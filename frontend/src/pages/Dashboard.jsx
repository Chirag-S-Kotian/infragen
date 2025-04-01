import { useUser } from "@clerk/clerk-react";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p>Manage your infrastructure code and templates</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
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
              <button className="dashboard-button">New Generation</button>
              <button className="dashboard-button">Create Template</button>
              <button className="dashboard-button">View History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 