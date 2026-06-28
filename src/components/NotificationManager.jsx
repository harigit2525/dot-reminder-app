import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellRing, Clock, Check, X } from 'lucide-react';
import { updateTask } from '../services/db';

export default function NotificationManager({ userId, tasks, onTasksUpdated }) {
  const [activeAlarms, setActiveAlarms] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const audioTimerRef = useRef(null);

  // Ask for Web Notification Permissions
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, []);

  // Poll for alarms every 5 seconds
  useEffect(() => {
    if (!userId) return;

    alarmIntervalRef.current = setInterval(() => {
      checkReminders();
    }, 5000);

    // Initial check
    checkReminders();

    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [userId, tasks]);

  // Handle active audio alarms
  useEffect(() => {
    if (activeAlarms.length > 0) {
      startAlarmSound();
    } else {
      stopAlarmSound();
    }

    return () => stopAlarmSound();
  }, [activeAlarms]);

  // Main reminder checking logic
  const checkReminders = () => {
    if (!userId || !tasks) return;
    const now = new Date();
    const nowMs = now.getTime();

    const triggeredTasks = [];

    tasks.forEach(task => {
      // Alarm conditions:
      // 1. Not completed
      // 2. Alarm not already triggered
      // 3. Task date-time exists and has arrived/passed (within 24 hours to prevent matching very old tasks)
      if (task.completed || task.alarmTriggered) return;

      const taskTime = new Date(task.dateTime).getTime();
      const differenceMs = nowMs - taskTime;

      // Trigger if current time is equal to or past the task time (up to 24h old)
      if (differenceMs >= 0 && differenceMs < 24 * 60 * 60 * 1000) {
        triggeredTasks.push(task);
      }
    });

    if (triggeredTasks.length > 0) {
      // Update database task alarmTriggered states immediately to prevent double triggers
      triggeredTasks.forEach(task => {
        updateTask(userId, task.id, { alarmTriggered: true });
      });

      // Add to state queue
      setActiveAlarms(prev => {
        // Filter duplicates
        const uniqueNew = triggeredTasks.filter(nt => !prev.some(pt => pt.id === nt.id));
        return [...prev, ...uniqueNew];
      });

      // Trigger HTML5 System Notification
      triggeredTasks.forEach(task => {
        triggerSystemNotification(task);
      });

      // Let parent know that tasks were updated (database writes occurred)
      onTasksUpdated();
    }
  };

  // Trigger Native Desktop Notification
  const triggerSystemNotification = (task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Reminder: ${task.title}`, {
        body: task.description || 'Time to complete your scheduled task!',
        icon: '/favicon.ico',
        tag: task.id,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Synthesize alarm sound using Web Audio API
  const startAlarmSound = () => {
    try {
      // Ensure AudioContext is created
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Clear any existing tone triggers
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);

      // Play beeps periodically
      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Cyclic double tone (like digital watch beeps)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      };

      // Play immediately, then every 1 second
      playBeep();
      audioTimerRef.current = setInterval(playBeep, 1000);
    } catch (e) {
      console.warn('Web Audio alarm failed to play:', e);
    }
  };

  const stopAlarmSound = () => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };

  // Snooze active task by 5 minutes
  const handleSnooze = (task) => {
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
    
    // Format to YYYY-MM-DDTHH:MM local string format
    const timezoneOffset = snoozeTime.getTimezoneOffset() * 60000;
    const localSnoozeStr = new Date(snoozeTime.getTime() - timezoneOffset).toISOString().slice(0, 16);

    // Save to DB (resets alarmTriggered automatically)
    updateTask(userId, task.id, {
      dateTime: localSnoozeStr,
      snoozedCount: (task.snoozedCount || 0) + 1
    });

    // Remove from active queue
    setActiveAlarms(prev => prev.filter(t => t.id !== task.id));
    onTasksUpdated();
  };

  // Complete active task from alarm screen
  const handleComplete = (task) => {
    updateTask(userId, task.id, { completed: true });
    setActiveAlarms(prev => prev.filter(t => t.id !== task.id));
    onTasksUpdated();
  };

  // Dismiss / Silence task (remains incomplete but won't ring again)
  const handleDismiss = (task) => {
    setActiveAlarms(prev => prev.filter(t => t.id !== task.id));
  };

  if (activeAlarms.length === 0) return null;

  // Show only the first alarm in the queue
  const currentAlarm = activeAlarms[0];

  return (
    <div className="alarm-overlay animate-fade-in">
      <style>{`
        .alarm-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(4, 4, 12, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .alarm-dialog {
          width: 100%;
          max-width: 460px;
          padding: 2.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.25);
          border: 1px solid rgba(239, 68, 68, 0.3);
          animation: pulseGlow 2s infinite;
        }

        .alarm-icon-container {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--danger-glow);
          color: var(--danger);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(239, 68, 68, 0.4);
          margin-bottom: 0.5rem;
        }

        .alarm-icon-ring {
          animation: ringAlarm 0.5s infinite;
        }

        .alarm-title-group h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .alarm-time-tag {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--danger);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .alarm-desc {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .alarm-category-badge {
          margin-top: -0.5rem;
        }

        .alarm-actions {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .alarm-actions-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .btn-snooze {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: var(--warning);
        }

        .btn-snooze:hover {
          background: rgba(245, 158, 11, 0.25);
        }

        .btn-complete-alarm {
          background: var(--success);
          color: white;
          box-shadow: 0 4px 12px var(--success-glow);
        }

        .btn-complete-alarm:hover {
          background: hsl(160, 75%, 40%);
        }

        .btn-dismiss-alarm {
          background: transparent;
          border: 1px solid var(--panel-border);
          color: var(--text-muted);
        }

        .btn-dismiss-alarm:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }
      `}</style>

      <div className="alarm-dialog glass-panel animate-scale-in">
        <div className="alarm-icon-container">
          <BellRing className="alarm-icon-ring" size={40} />
        </div>

        <div className="alarm-title-group">
          <span className="alarm-time-tag">Reminder Firing</span>
          <h2>{currentAlarm.title}</h2>
        </div>

        {currentAlarm.description && <p className="alarm-desc">{currentAlarm.description}</p>}

        <span className={`badge alarm-category-badge cat-${(currentAlarm.category || 'general').toLowerCase()}`}>
          {currentAlarm.category}
        </span>

        <div className="alarm-actions">
          <div className="alarm-actions-row">
            <button className="btn-snooze" onClick={() => handleSnooze(currentAlarm)}>
              <Clock size={18} />
              <span>Snooze (5m)</span>
            </button>
            <button className="btn-complete-alarm" onClick={() => handleComplete(currentAlarm)}>
              <Check size={18} />
              <span>Complete</span>
            </button>
          </div>
          <button className="btn-dismiss-alarm" onClick={() => handleDismiss(currentAlarm)}>
            <X size={16} />
            <span>Silence / Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
