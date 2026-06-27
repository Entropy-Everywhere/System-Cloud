// System Cloud client-side database & auth helper

const DB = {
  // Retrieve users, seeding defaults if they don't exist
  getUsers() {
    const data = localStorage.getItem('plural_users');
    if (!data) {
      const defaults = [
        { username: 'john_doe', email: 'john@example.com', password: 'password123' },
        { username: 'jane_smith', email: 'jane@example.com', password: 'password456' }
      ];
      localStorage.setItem('plural_users', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  saveUsers(users) {
    localStorage.setItem('plural_users', JSON.stringify(users));
  },

  // Retrieve alters, seeding sample ones for john_doe initially
  getAlters() {
    const data = localStorage.getItem('plural_alters');
    if (!data) {
      const defaults = [
        { altername: 'Alex', description: 'System host, organized and calm. Loves coffee and reading.', prn: 'they/them', category: 'Host', status: 'Fronting', user: 'john_doe', timestamp: new Date().toISOString() },
        { altername: 'Luna', description: 'Protector, quiet, protective of the system. Nocturnal schedule.', prn: 'she/her', category: 'Protector', status: 'Inactive', user: 'john_doe', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('plural_alters', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  saveAlters(alters) {
    localStorage.setItem('plural_alters', JSON.stringify(alters));
  },

  // Retrieve active fronters lists per system
  getFronters() {
    const data = localStorage.getItem('plural_fronters');
    if (!data) {
      const defaults = {
        'john_doe': ['Alex'], // Alex is initially fronting
        'jane_smith': []
      };
      localStorage.setItem('plural_fronters', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  },

  saveFronters(fronters) {
    localStorage.setItem('plural_fronters', JSON.stringify(fronters));
  },

  getCurrentUser() {
    return localStorage.getItem('plural_current_user');
  },

  getCurrentUserProfile() {
    const username = this.getCurrentUser();
    if (!username) return null;
    const users = this.getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  },

  updateUserProfile(username, updates) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.username.toLowerCase() === username.toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);
    return { success: true, user: users[userIndex] };
  },

  deleteUser(username) {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.username.toLowerCase() !== username.toLowerCase());
    if (filteredUsers.length === users.length) {
      return { success: false, message: 'User not found.' };
    }

    this.saveUsers(filteredUsers);

    const alters = this.getAlters().filter(alter => alter.user.toLowerCase() !== username.toLowerCase());
    this.saveAlters(alters);

    const fronters = this.getFronters();
    delete fronters[username];
    this.saveFronters(fronters);

    localStorage.removeItem('plural_current_user');
    return { success: true };
  },

  login(username, password) {
    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (user) {
      localStorage.setItem('plural_current_user', user.username);
      return { success: true, user };
    }
    return { success: false, message: 'Invalid username or password.' };
  },

  signup(username, email, password) {
    const users = this.getUsers();
    const exists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return { success: false, message: 'Username is already taken.' };
    }
    const newUser = { username: username.trim(), email: email.trim() || `${username.trim()}@example.com`, password };
    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem('plural_current_user', newUser.username);
    return { success: true, user: newUser };
  },

  logout() {
    localStorage.removeItem('plural_current_user');
    const inPagesDir = window.location.pathname.includes('/pages/');
    window.location.href = inPagesDir ? 'login.html' : 'pages/login.html';
  },

  checkAuth(isLoginPage = false) {
    const currentUser = this.getCurrentUser();
    const inPagesDir = window.location.pathname.includes('/pages/');

    if (isLoginPage) {
      if (currentUser) {
        window.location.href = inPagesDir ? 'homepage.html' : 'pages/homepage.html';
      }
    } else {
      if (!currentUser) {
        window.location.href = inPagesDir ? 'login.html' : 'pages/login.html';
      }
    }
  },

  // Toast System Injector
  showToast(message, type = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.fontFamily = "'Outfit', sans-serif";
    toast.style.fontWeight = '500';
    toast.style.fontSize = '14px';
    toast.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    toast.style.transform = 'translateY(50px)';
    toast.style.opacity = '0';
    toast.innerText = message;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    // Remove toast
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3500);
  }
};

// Seed database immediately on script parse
DB.getUsers();
DB.getAlters();
DB.getFronters();
