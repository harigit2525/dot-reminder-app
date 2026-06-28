import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NotificationManager from './components/NotificationManager';
import { getCurrentUser } from './services/auth';
import { getTasks } from './services/db';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const activeUser = getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
      setTasks(getTasks(activeUser.id));
    }
    setLoading(false);
  }, []);

  // Update tasks list state when task updates happen in child components
  const refreshTasksList = () => {
    if (user) {
      setTasks(getTasks(user.id));
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setTasks(getTasks(authenticatedUser.id));
  };

  const handleLogout = () => {
    setUser(null);
    setTasks([]);
  };

  if (loading) {
    return (
      <div className="app-loader">
        <style>{`
          .app-loader {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-secondary);
            font-family: 'Outfit', sans-serif;
          }
          .loader-pulse {
            animation: textPulse 1.5s infinite ease-in-out;
          }
          @keyframes textPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
        <span className="loader-pulse">Initializing dot...</span>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <>
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
          />
          {/* Notification manager runs quietly in background, tracking schedules */}
          <NotificationManager 
            userId={user.id} 
            tasks={tasks} 
            onTasksUpdated={refreshTasksList} 
          />
        </>
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

export default App;
