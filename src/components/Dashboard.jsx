import React, { useState, useEffect } from 'react';
import { logoutUser } from '../services/auth';
import { getTasks, createTask, updateTask, deleteTask } from '../services/db';
import CalendarView from './CalendarView';
import { 
  LogOut, ListTodo, Calendar, BarChart3, Plus, Search, Trash2, 
  Edit3, SlidersHorizontal, Sun, Moon, Clock, AlertTriangle, 
  CheckCircle2, Circle, Eye, Filter, User, HelpCircle, Check, X
} from 'lucide-react';

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'calendar', 'analytics'
  const [tasks, setTasks] = useState([]);
  const [isThemeDark, setIsThemeDark] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed', 'overdue'
  const [sortBy, setSortBy] = useState('dateTime'); // 'dateTime', 'priority'

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // New/Edit task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDateTime, setTaskDateTime] = useState('');
  const [taskCategory, setTaskCategory] = useState('General');
  const [taskPriority, setTaskPriority] = useState('medium');

  // Load user tasks
  const loadTasks = () => {
    if (user) {
      setTasks(getTasks(user.id));
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  // Handle system-wide notification hooks updating state
  useEffect(() => {
    const handleStorageChange = () => {
      loadTasks();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const root = document.documentElement;
    if (isThemeDark) {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    setIsThemeDark(!isThemeDark);
  };

  const handleLogoutClick = () => {
    logoutUser();
    onLogout();
  };

  // Open task modal in 'create' mode
  const handleOpenCreateModal = (prefilledDate = '') => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    
    // Set default datetime to now + 1 hour or a prefilled date from calendar click
    const date = new Date();
    if (prefilledDate) {
      // prefilledDate format: YYYY-MM-DD
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setTaskDateTime(`${prefilledDate}T${timeStr}`);
    } else {
      date.setHours(date.getHours() + 1);
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      const localISO = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
      setTaskDateTime(localISO);
    }
    setTaskCategory('General');
    setTaskPriority('medium');
    setShowTaskModal(true);
  };

  // Open task modal in 'edit' mode
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskDateTime(task.dateTime);
    setTaskCategory(task.category);
    setTaskPriority(task.priority);
    setShowTaskModal(true);
  };

  // Create or Update task submit
  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDateTime) return;

    const taskData = {
      title: taskTitle,
      description: taskDesc,
      dateTime: taskDateTime,
      category: taskCategory,
      priority: taskPriority
    };

    if (editingTask) {
      updateTask(user.id, editingTask.id, taskData);
    } else {
      createTask(user.id, taskData);
    }

    setShowTaskModal(false);
    loadTasks();
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      deleteTask(user.id, taskId);
      loadTasks();
    }
  };

  // Toggle complete state
  const handleToggleComplete = (task) => {
    updateTask(user.id, task.id, { completed: !task.completed });
    loadTasks();
  };

  // Compute status helpers
  const isOverdue = (task) => {
    if (task.completed) return false;
    const taskTime = new Date(task.dateTime).getTime();
    return Date.now() > taskTime;
  };

  // Filter and sort computation
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || task.category.toLowerCase() === categoryFilter.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = task.completed;
    } else if (statusFilter === 'pending') {
      matchesStatus = !task.completed && !isOverdue(task);
    } else if (statusFilter === 'overdue') {
      matchesStatus = isOverdue(task);
    }

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'dateTime') {
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    } else if (sortBy === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    return 0;
  });

  // Calculate statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const overdueTasksCount = tasks.filter(t => isOverdue(t)).length;
  const pendingTasksCount = totalTasksCount - completedTasksCount - overdueTasksCount;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Group tasks by category for analytics
  const categoriesList = ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'General'];
  const categoryStats = categoriesList.map(cat => {
    const catTasks = tasks.filter(t => t.category.toLowerCase() === cat.toLowerCase());
    const completed = catTasks.filter(t => t.completed).length;
    const total = catTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: cat, total, completed, rate };
  });

  // Group tasks by priority for analytics
  const priorityStats = ['low', 'medium', 'high'].map(pri => {
    const priTasks = tasks.filter(t => t.priority === pri);
    const completed = priTasks.filter(t => t.completed).length;
    const total = priTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: pri, total, completed, rate };
  });

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }
        }

        /* Sidebar Styling */
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.5rem;
          border-right: 1px solid var(--panel-border);
          background: rgba(10, 10, 22, 0.5);
          backdrop-filter: blur(10px);
        }

        .light-theme .sidebar {
          background: rgba(255, 255, 255, 0.4);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--panel-border);
            padding: 1rem;
            flex-direction: row;
            align-items: center;
          }
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        @media (max-width: 768px) {
          .sidebar-top {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          }
        }

        .brand-section {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          display: flex;
          align-items: center;
          gap: 0.1rem;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          background: hsla(0, 0%, 100%, 0.03);
          border: 1px solid var(--panel-border);
        }

        @media (max-width: 768px) {
          .user-profile {
            padding: 0.4rem 0.6rem;
          }
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-glow);
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid var(--accent-color);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none; /* Hide standard nav on mobile, use dropdown or tabs */
          }
        }

        .nav-btn {
          width: 100%;
          justify-content: flex-start;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          border-radius: var(--radius-sm);
        }

        .nav-btn.active {
          background: var(--accent-color);
          color: white;
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .progress-card {
          margin-top: 1rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: var(--panel-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--accent-color);
          transition: width var(--transition-normal);
        }

        .sidebar-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }

        @media (max-width: 768px) {
          .sidebar-bottom {
            flex-direction: row;
            width: auto;
            align-items: center;
          }
        }

        .theme-toggle-btn {
          width: 100%;
          border-radius: var(--radius-sm);
        }

        @media (max-width: 768px) {
          .theme-toggle-btn, .logout-btn {
            width: 2.2rem;
            height: 2.2rem;
            padding: 0;
          }
          .theme-toggle-btn span, .logout-btn span {
            display: none;
          }
        }

        /* Main Content Workspace */
        .workspace {
          flex-grow: 1;
          padding: 2.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (max-width: 768px) {
          .workspace {
            padding: 1.25rem;
            gap: 1.25rem;
          }
        }

        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .workspace-title-group h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .workspace-title-group p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Mobile View Selector Tabs */
        .mobile-tabs {
          display: none;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.25rem;
          padding: 0.25rem;
          background: hsla(0, 0%, 100%, 0.02);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius-sm);
        }

        @media (max-width: 768px) {
          .mobile-tabs {
            display: grid;
          }
        }

        .mobile-tab-btn {
          padding: 0.5rem;
          font-size: 0.85rem;
          border-radius: 6px;
          background: transparent;
        }

        .mobile-tab-btn.active {
          background: var(--accent-color);
          color: white;
        }

        /* Stats Cards Dashboard */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .stat-icon.green { background: var(--success-glow); color: var(--success); }
        .stat-icon.yellow { background: var(--warning-glow); color: var(--warning); }
        .stat-icon.red { background: var(--danger-glow); color: var(--danger); }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Toolbar Filters section */
        .toolbar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toolbar-top {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 600px) {
          .toolbar-top {
            flex-direction: column;
          }
        }

        .search-box {
          position: relative;
          flex-grow: 1;
          display: flex;
          align-items: center;
        }

        .search-box input {
          width: 100%;
          padding-left: 2.75rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-select-group span {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .filter-select-group select {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          font-size: 0.85rem;
        }

        /* Tasks List */
        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-card {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        @media (max-width: 600px) {
          .task-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .task-card-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-grow: 1;
        }

        .task-check-btn {
          background: transparent;
          border: none;
          padding: 0;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .task-check-btn:hover {
          color: var(--accent-color);
        }

        .task-check-btn.completed {
          color: var(--success);
        }

        .task-info-block {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .task-title {
          font-size: 1.1rem;
          font-weight: 600;
          transition: color var(--transition-fast);
        }

        .task-title.completed {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .task-desc-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .task-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
        }

        .task-date-tag {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .task-date-tag.overdue {
          color: var(--danger);
        }

        .task-date-tag.pending {
          color: var(--accent-color);
        }

        .task-date-tag.completed {
          color: var(--success);
        }

        .snooze-count-tag {
          color: var(--warning);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .task-card-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 600px) {
          .task-card-right {
            width: 100%;
            justify-content: flex-end;
            border-top: 1px solid var(--panel-border);
            padding-top: 0.75rem;
            margin-top: 0.25rem;
          }
        }

        /* Empty State */
        .empty-tasks-state {
          text-align: center;
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
        }

        /* Analytics Tab View */
        .analytics-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          animation: fadeIn var(--transition-normal);
        }

        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chart-card h3 {
          font-size: 1.15rem;
          font-weight: 700;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 0.75rem;
        }

        .chart-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chart-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .chart-item-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .chart-progress-bg {
          width: 100%;
          height: 8px;
          background: var(--panel-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .chart-progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }

        /* Modal Overlays */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(4, 4, 12, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-box {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 0.75rem;
        }

        .modal-header h2 {
          font-size: 1.35rem;
          font-weight: 700;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }

        .modal-close-btn:hover {
          color: var(--text-primary);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
      `}</style>

      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="brand-section">
            dot<span className="logo-dot" style={{ color: 'var(--accent-color)' }}>.</span>
          </div>

          <div className="user-profile">
            <div className="avatar-circle">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-btn btn-secondary ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <ListTodo size={18} />
              <span>Reminders</span>
            </button>
            <button 
              className={`nav-btn btn-secondary ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={18} />
              <span>Calendar</span>
            </button>
            <button 
              className={`nav-btn btn-secondary ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </button>

            {/* In-sidebar Stats summary */}
            <div className="progress-card glass-panel">
              <div className="progress-header">
                <span>Task Complete</span>
                <span>{completionRate}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="btn-secondary theme-toggle-btn" onClick={toggleTheme} title="Toggle styling mode">
            {isThemeDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isThemeDark ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
          <button className="btn-danger logout-btn" onClick={handleLogoutClick} title="Logout account">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="workspace">
        {/* Mobile View Selector Tabs */}
        <div className="mobile-tabs">
          <button 
            className={`mobile-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={`mobile-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
          <button 
            className={`mobile-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Dynamic content depending on activeTab */}
        {activeTab === 'tasks' && (
          <>
            <div className="workspace-header">
              <div className="workspace-title-group">
                <h1>My Reminders</h1>
                <p>Set alarms and manage your schedule</p>
              </div>
              <button className="btn-primary" onClick={() => handleOpenCreateModal()}>
                <Plus size={18} />
                <span>New Alarm</span>
              </button>
            </div>

            {/* Quick dashboard statistics grid */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-icon blue"><ListTodo size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{totalTasksCount}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon green"><CheckCircle2 size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{completedTasksCount}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon yellow"><Clock size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{pendingTasksCount}</span>
                  <span className="stat-label">Active</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon red"><AlertTriangle size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{overdueTasksCount}</span>
                  <span className="stat-label">Overdue</span>
                </div>
              </div>
            </div>

            {/* Toolbar Filters / Sorts */}
            <div className="toolbar glass-panel" style={{ padding: '1rem' }}>
              <div className="toolbar-top">
                <div className="search-box">
                  <Search className="search-icon" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="filters-row">
                <div className="filter-select-group">
                  <span><Filter size={14} /> Category</span>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-select-group">
                  <span>Status</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Reminders</option>
                    <option value="pending">Active</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="filter-select-group" style={{ marginLeft: 'auto' }}>
                  <span><SlidersHorizontal size={14} /> Sort By</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="dateTime">Time & Date</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tasks list */}
            <div className="tasks-list">
              {filteredTasks.length === 0 ? (
                <div className="empty-tasks-state glass-panel">
                  <ListTodo size={40} />
                  <div>
                    <h3>No reminders found</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      Add a new alarm task or adjust your search filters to get started.
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => handleOpenCreateModal()}>
                    <Plus size={18} />
                    <span>Create Tasks</span>
                  </button>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const taskTime = new Date(task.dateTime);
                  const isTaskOverdue = isOverdue(task);
                  const formattedTimeStr = taskTime.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div 
                      key={task.id} 
                      className={`task-card glass-panel ${task.completed ? '' : 'glass-panel-interactive'}`}
                    >
                      <div className="task-card-left">
                        <button 
                          className={`task-check-btn ${task.completed ? 'completed' : ''}`}
                          onClick={() => handleToggleComplete(task)}
                          title={task.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>

                        <div className="task-info-block">
                          <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                            {task.title}
                          </span>
                          {task.description && <p className="task-desc-text">{task.description}</p>}
                          
                          <div className="task-meta-row">
                            {/* Timing indicator with badge states */}
                            <span className={`task-date-tag ${task.completed ? 'completed' : isTaskOverdue ? 'overdue' : 'pending'}`}>
                              <Clock size={12} />
                              {formattedTimeStr}
                              {isTaskOverdue && ' (Overdue)'}
                            </span>
                            
                            {/* Category Tag */}
                            <span className={`cat-tag cat-${(task.category || 'general').toLowerCase()}`}>
                              {task.category}
                            </span>

                            {/* Priority Badge */}
                            <span className={`badge badge-priority-${task.priority}`}>
                              {task.priority}
                            </span>

                            {/* Snooze counter badge */}
                            {task.snoozedCount > 0 && (
                              <span className="snooze-count-tag">
                                <Clock size={12} />
                                Snoozed {task.snoozedCount}x
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="task-card-right">
                        <button 
                          className="btn-secondary btn-icon" 
                          onClick={() => handleOpenEditModal(task)}
                          title="Edit reminder"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="btn-secondary btn-icon" 
                          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete reminder"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'calendar' && (
          <>
            <div className="workspace-header">
              <div className="workspace-title-group">
                <h1>Interactive Calendar</h1>
                <p>Visualize your reminders monthly</p>
              </div>
            </div>
            <CalendarView 
              tasks={tasks}
              onAddTaskClick={(prefilledDate) => handleOpenCreateModal(prefilledDate)}
              onEditTaskClick={(task) => handleOpenEditModal(task)}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-view">
            <div className="workspace-header">
              <div className="workspace-title-group">
                <h1>Task Insights & Analytics</h1>
                <p>Evaluate your scheduling metrics</p>
              </div>
            </div>

            {/* Quick dashboard statistics grid */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-icon blue"><ListTodo size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{totalTasksCount}</span>
                  <span className="stat-label">Total Alarms</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon green"><CheckCircle2 size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{completionRate}%</span>
                  <span className="stat-label">Completion Rate</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon yellow"><Clock size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{pendingTasksCount}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-icon red"><AlertTriangle size={22} /></div>
                <div className="stat-info">
                  <span className="stat-value">{overdueTasksCount}</span>
                  <span className="stat-label">Overdue</span>
                </div>
              </div>
            </div>

            <div className="analytics-charts-grid">
              {/* Category charts */}
              <div className="chart-card glass-panel">
                <h3>Breakdown by Category</h3>
                <div className="chart-list">
                  {categoryStats.map(stat => (
                    <div key={stat.name} className="chart-item">
                      <div className="chart-item-label">
                        <span>{stat.name} ({stat.total})</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{stat.completed} completed • {stat.rate}%</span>
                      </div>
                      <div className="chart-progress-bg">
                        <div 
                          className="chart-progress-fill" 
                          style={{ 
                            width: `${stat.total > 0 ? stat.rate : 0}%`,
                            background: stat.name === 'Work' ? '#3b82f6' : 
                                        stat.name === 'Personal' ? '#a855f7' :
                                        stat.name === 'Shopping' ? '#ec4899' :
                                        stat.name === 'Health' ? '#10b981' :
                                        stat.name === 'Finance' ? '#f59e0b' : '#9ca3af'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority charts */}
              <div className="chart-card glass-panel">
                <h3>Breakdown by Priority</h3>
                <div className="chart-list">
                  {priorityStats.map(stat => (
                    <div key={stat.name} className="chart-item">
                      <div className="chart-item-label">
                        <span style={{ textTransform: 'capitalize' }}>{stat.name} ({stat.total})</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{stat.completed} completed • {stat.rate}%</span>
                      </div>
                      <div className="chart-progress-bg">
                        <div 
                          className="chart-progress-fill" 
                          style={{ 
                            width: `${stat.total > 0 ? stat.rate : 0}%`,
                            background: stat.name === 'low' ? 'var(--success)' :
                                        stat.name === 'medium' ? 'var(--warning)' : 'var(--danger)'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Task Creation / Editing Modal */}
      {showTaskModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowTaskModal(false)}>
          <div className="modal-box glass-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Alarm Reminder' : 'Set New Alarm'}</h2>
              <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label htmlFor="modalTitle">Task Title</label>
                <input 
                  id="modalTitle"
                  type="text" 
                  placeholder="e.g. Meditate and drink water" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="modalDesc">Description (Optional)</label>
                <textarea 
                  id="modalDesc"
                  placeholder="Details about the task..." 
                  value={taskDesc}
                  rows={3}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="modalTime">Date & Time for Alarm</label>
                <input 
                  id="modalTime"
                  type="datetime-local" 
                  value={taskDateTime}
                  onChange={(e) => setTaskDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modalCategory">Category</label>
                  <select 
                    id="modalCategory"
                    value={taskCategory} 
                    onChange={(e) => setTaskCategory(e.target.value)}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="modalPriority">Priority</label>
                  <select 
                    id="modalPriority"
                    value={taskPriority} 
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Set Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
