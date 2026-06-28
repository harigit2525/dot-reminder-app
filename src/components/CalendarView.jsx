import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react';

export default function CalendarView({ tasks, onAddTaskClick, onEditTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days of week header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get tasks for a specific date (represented as YYYY-MM-DD local string)
  const getTasksForDate = (dateStr) => {
    return tasks.filter(task => {
      if (!task.dateTime) return false;
      const taskDate = task.dateTime.split('T')[0]; // Format: YYYY-MM-DD
      return taskDate === dateStr;
    });
  };

  // Check if dates match (ignoring time)
  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  // Render Calendar Grid Cells
  const renderDays = () => {
    const cells = [];
    const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDay + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
      
      const cellDate = isValidDay ? new Date(year, month, dayNum) : null;
      const dateStr = cellDate ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : '';
      const dayTasks = cellDate ? getTasksForDate(dateStr) : [];
      
      const isSelected = cellDate && isSameDay(cellDate, selectedDate);
      const isToday = cellDate && isSameDay(cellDate, new Date());

      cells.push(
        <div
          key={i}
          className={`calendar-cell ${isValidDay ? 'valid' : 'empty'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => isValidDay && setSelectedDate(cellDate)}
        >
          {isValidDay && (
            <>
              <span className="day-number">{dayNum}</span>
              {dayTasks.length > 0 && (
                <div className="task-indicators">
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <span 
                      key={task.id} 
                      className={`indicator-dot priority-${task.priority} ${task.completed ? 'completed' : ''}`}
                      title={task.title}
                    />
                  ))}
                  {dayTasks.length > 3 && <span className="indicator-plus">+{dayTasks.length - 3}</span>}
                </div>
              )}
            </>
          )}
        </div>
      );
    }
    return cells;
  };

  // Selected date details
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDateTasks = getTasksForDate(selectedDateStr);
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="calendar-view-container animate-fade-in">
      <style>{`
        .calendar-view-container {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
          height: calc(100vh - 120px);
        }

        @media (max-width: 1024px) {
          .calendar-view-container {
            grid-template-columns: 1fr;
            height: auto;
          }
        }

        .calendar-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .calendar-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .calendar-title-group h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .calendar-nav-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .grid-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          flex-grow: 1;
        }

        .calendar-cell {
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          border: 1px solid var(--panel-border);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          transition: all var(--transition-fast);
        }

        .calendar-cell.valid {
          cursor: pointer;
          background: hsla(0, 0%, 100%, 0.02);
        }

        .calendar-cell.valid:hover {
          border-color: var(--accent-color);
          background: hsla(0, 0%, 100%, 0.05);
          transform: scale(1.02);
        }

        .calendar-cell.empty {
          opacity: 0;
          pointer-events: none;
        }

        .calendar-cell.today {
          border-color: var(--accent-color);
          background: var(--accent-glow);
        }

        .calendar-cell.selected {
          border-color: var(--accent-color-hover);
          background: var(--accent-color);
          box-shadow: 0 4px 12px var(--accent-glow);
        }

        .calendar-cell.selected .day-number,
        .calendar-cell.selected .indicator-plus {
          color: #ffffff;
        }

        .day-number {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .task-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          align-items: center;
        }

        .indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .indicator-dot.priority-low { background-color: var(--success); }
        .indicator-dot.priority-medium { background-color: var(--warning); }
        .indicator-dot.priority-high { background-color: var(--danger); }
        .indicator-dot.completed { opacity: 0.4; text-decoration: line-through; }

        .indicator-plus {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .calendar-agenda-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }

        .agenda-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--panel-border);
          padding-bottom: 0.75rem;
        }

        .agenda-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .agenda-date {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .agenda-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .agenda-task-item {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          background: hsla(0, 0%, 100%, 0.02);
          border: 1px solid var(--panel-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .agenda-task-item:hover {
          background: hsla(0, 0%, 100%, 0.05);
          border-color: var(--text-muted);
        }

        .agenda-task-left {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .agenda-task-time {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-color);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .agenda-task-title {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .agenda-task-title.completed {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .agenda-task-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .no-tasks-state {
          text-align: center;
          padding: 2.5rem 1rem;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>

      {/* Calendar Grid Card */}
      <div className="calendar-card glass-panel">
        <div className="calendar-header">
          <div className="calendar-title-group">
            <CalendarIcon className="text-accent" style={{ color: 'var(--accent-color)' }} />
            <h2>{monthNames[month]} {year}</h2>
          </div>
          <div className="calendar-nav-buttons">
            <button className="btn-secondary btn-icon" onClick={handlePrevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <button className="btn-secondary btn-icon" onClick={handleNextMonth} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid-header">
          {weekDays.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid-body">
          {renderDays()}
        </div>
      </div>

      {/* Selected Day Agenda Panel */}
      <div className="calendar-agenda-card glass-panel">
        <div className="agenda-header">
          <div>
            <h3>Agenda</h3>
            <span className="agenda-date">{formattedSelectedDate}</span>
          </div>
          <button 
            className="btn-primary btn-icon" 
            onClick={() => onAddTaskClick(selectedDateStr)}
            title="Add Task for this Day"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="agenda-tasks-list">
          {selectedDateTasks.length === 0 ? (
            <div className="no-tasks-state">
              <CalendarIcon size={32} />
              <p>No reminders scheduled for this day.</p>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginTop: '0.5rem' }}
                onClick={() => onAddTaskClick(selectedDateStr)}
              >
                Create Task
              </button>
            </div>
          ) : (
            selectedDateTasks.map(task => {
              const timeStr = task.dateTime.split('T')[1]; // HH:MM
              return (
                <div 
                  key={task.id} 
                  className="agenda-task-item"
                  onClick={() => onEditTaskClick(task)}
                >
                  <div className="agenda-task-left">
                    <span className="agenda-task-time">
                      <Bell size={12} />
                      {timeStr}
                    </span>
                    <span className={`agenda-task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="agenda-task-right">
                    <span className={`badge badge-priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
