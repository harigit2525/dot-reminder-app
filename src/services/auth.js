// Simulated client-side authentication service using Web Crypto API and localStorage.

// Helper to hash password using SHA-256
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function registerUser(username, email, password) {
  try {
    const users = JSON.parse(localStorage.getItem('dot_users') || '[]');
    
    // Check if email already exists
    const normalizedEmail = email.toLowerCase().trim();
    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    // Check if username already exists
    const trimmedUsername = username.trim();
    if (users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      throw new Error('Username is already taken.');
    }

    const passwordHash = await hashPassword(password);
    
    const newUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('dot_users', JSON.stringify(users));

    // Automatically log in the new user
    const { passwordHash: _, ...userSession } = newUser;
    localStorage.setItem('dot_current_user', JSON.stringify(userSession));
    
    return userSession;
  } catch (error) {
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const users = JSON.parse(localStorage.getItem('dot_users') || '[]');
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email === normalizedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const { passwordHash: _, ...userSession } = user;
    localStorage.setItem('dot_current_user', JSON.stringify(userSession));
    
    return userSession;
  } catch (error) {
    throw error;
  }
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('dot_current_user');
  return userJson ? JSON.parse(userJson) : null;
}

export function logoutUser() {
  localStorage.removeItem('dot_current_user');
}
