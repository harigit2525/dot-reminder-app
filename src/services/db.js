// Simulated database service for task CRUD operations using localStorage.

export function getTasks(userId) {
  if (!userId) return [];
  const tasks = JSON.parse(localStorage.getItem('dot_tasks') || '[]');
  return tasks.filter(t => t.userId === userId);
}

export function createTask(userId, taskData) {
  if (!userId) throw new Error('User not authenticated.');
  const tasks = JSON.parse(localStorage.getItem('dot_tasks') || '[]');
  
  const newTask = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    userId,
    title: taskData.title.trim(),
    description: (taskData.description || '').trim(),
    dateTime: taskData.dateTime, // ISO datetime string: YYYY-MM-DDTHH:MM
    category: taskData.category || 'General',
    priority: taskData.priority || 'medium', // 'low', 'medium', 'high'
    completed: false,
    alarmTriggered: false,
    snoozedCount: 0,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  localStorage.setItem('dot_tasks', JSON.stringify(tasks));
  return newTask;
}

export function updateTask(userId, taskId, updatedFields) {
  if (!userId) throw new Error('User not authenticated.');
  const tasks = JSON.parse(localStorage.getItem('dot_tasks') || '[]');
  
  const taskIndex = tasks.findIndex(t => t.id === taskId && t.userId === userId);
  if (taskIndex === -1) {
    throw new Error('Task not found.');
  }

  // Update fields
  const updatedTask = {
    ...tasks[taskIndex],
    ...updatedFields
  };

  // If dateTime is modified, reset the alarmTriggered status
  if (updatedFields.dateTime && updatedFields.dateTime !== tasks[taskIndex].dateTime) {
    updatedTask.alarmTriggered = false;
    updatedTask.snoozedCount = 0;
  }

  // If completed status changed, toggle alarmTriggered to true if completed to avoid alarm
  if (updatedFields.completed === true) {
    updatedTask.alarmTriggered = true;
  } else if (updatedFields.completed === false) {
    // If unmarked as completed, and dateTime is in the future, allow alarm again
    const taskTime = new Date(updatedTask.dateTime).getTime();
    const now = Date.now();
    if (taskTime > now) {
      updatedTask.alarmTriggered = false;
    }
  }

  tasks[taskIndex] = updatedTask;
  localStorage.setItem('dot_tasks', JSON.stringify(tasks));
  return updatedTask;
}

export function deleteTask(userId, taskId) {
  if (!userId) throw new Error('User not authenticated.');
  const tasks = JSON.parse(localStorage.getItem('dot_tasks') || '[]');
  
  const filteredTasks = tasks.filter(t => !(t.id === taskId && t.userId === userId));
  localStorage.setItem('dot_tasks', JSON.stringify(filteredTasks));
}
