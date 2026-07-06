// System Cloud client-side database & auth helper

const DB = {
  _firestoreEnabled: false,
  _firebaseInitialized: false,
  _firebaseReadyPromise: null,
  _db: null,

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('No script source provided.'));
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error(`Failed to load script ${src}`)));
        if (existing.readyState === 'complete') resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${src}`));
      document.head.appendChild(script);
    });
  },

  async initFirestore() {
    if (this._firebaseReadyPromise) {
      return this._firebaseReadyPromise;
    }

    if (!window.FIRESTORE_ENABLED || !window.FIREBASE_CONFIG) {
      return Promise.resolve(false);
    }

    this._firestoreEnabled = true;
    const currentScript = document.querySelector('script[src$="database.js"]');
    const configScriptSrc = currentScript?.src?.replace(/database\.js$/, 'firebase-config.js');

    this._firebaseReadyPromise = Promise.resolve()
      .then(() => (configScriptSrc ? this._loadScript(configScriptSrc) : Promise.resolve()))
      .then(() => this._loadScript('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js'))
      .then(() => this._loadScript('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore-compat.js'))
      .then(() => {
        if (!window.firebase || !window.firebase.initializeApp) {
          throw new Error('Firebase SDK failed to load');
        }
        firebase.initializeApp(window.FIREBASE_CONFIG);
        this._db = firebase.firestore();
        return this._db.enablePersistence().catch(() => {
          // persistence may not be supported in all contexts; continue regardless
        });
      })
      .then(() => {
        this._firebaseInitialized = true;
        console.info('Firestore initialized successfully.');
        return this._syncFirestoreData();
      })
      .then(() => true)
      .catch((err) => {
        console.warn('Firestore initialization failed:', err);
        this._firestoreEnabled = false;
        return false;
      });

    return this._firebaseReadyPromise;
  },

  async _fetchFirestoreDoc(docId, fieldName) {
    if (!this._db) return null;
    try {
      const snapshot = await this._db.collection('app_data').doc(docId).get();
      if (!snapshot.exists) return null;
      const data = snapshot.data();
      return data ? data[fieldName] : null;
    } catch (error) {
      console.warn('Firestore fetch failed:', error);
      return null;
    }
  },

  async _saveFirestoreDoc(docId, fieldName, value) {
    if (!this._db) return false;
    try {
      await this._db.collection('app_data').doc(docId).set({ [fieldName]: value }, { merge: true });
      return true;
    } catch (error) {
      console.warn('Firestore save failed:', error);
      return false;
    }
  },

  async _syncFirestoreData() {
    if (!this._firestoreEnabled || !this._db) return;

    const [fireUsers, fireAlters, fireFronters, fireFolders, fireSettings] = await Promise.all([
      this._fetchFirestoreDoc('users', 'users'),
      this._fetchFirestoreDoc('alters', 'alters'),
      this._fetchFirestoreDoc('fronters', 'fronters'),
      this._fetchFirestoreDoc('folders', 'folders'),
      this._fetchFirestoreDoc('settings', 'settings')
    ]);

    const localUsers = localStorage.getItem('plural_users');
    const localAlters = localStorage.getItem('plural_alters');
    const localFronters = localStorage.getItem('plural_fronters');
    const localFolders = localStorage.getItem('plural_alter_folders');
    const localSettings = localStorage.getItem('plural_settings');

    if (fireUsers && !localUsers) {
      localStorage.setItem('plural_users', JSON.stringify(fireUsers));
    } else if (!fireUsers && localUsers) {
      await this._saveFirestoreDoc('users', 'users', JSON.parse(localUsers));
    }

    if (fireAlters && !localAlters) {
      localStorage.setItem('plural_alters', JSON.stringify(fireAlters));
    } else if (!fireAlters && localAlters) {
      await this._saveFirestoreDoc('alters', 'alters', JSON.parse(localAlters));
    }

    if (fireFronters && !localFronters) {
      localStorage.setItem('plural_fronters', JSON.stringify(fireFronters));
    } else if (!fireFronters && localFronters) {
      await this._saveFirestoreDoc('fronters', 'fronters', JSON.parse(localFronters));
    }

    if (fireFolders && !localFolders) {
      localStorage.setItem('plural_alter_folders', JSON.stringify(fireFolders));
    } else if (!fireFolders && localFolders) {
      await this._saveFirestoreDoc('folders', 'folders', JSON.parse(localFolders));
    }

    if (fireSettings && !localSettings) {
      localStorage.setItem('plural_settings', JSON.stringify(fireSettings));
    } else if (!fireSettings && localSettings) {
      await this._saveFirestoreDoc('settings', 'settings', JSON.parse(localSettings));
    }
  },

  getUsers() {
    const data = localStorage.getItem('plural_users');
    if (!data) {
      const defaults = [
        { username: 'john_doe', email: 'john@example.com', password: 'password123' },
        { username: 'jane_smith', email: 'jane@example.com', password: 'password456' }
      ];
      localStorage.setItem('plural_users', JSON.stringify(defaults));
      if (window.FIRESTORE_ENABLED) {
        this.initFirestore().then(() => this._saveFirestoreDoc('users', 'users', defaults));
      }
      return defaults;
    }
    return JSON.parse(data);
  },

  saveUsers(users) {
    localStorage.setItem('plural_users', JSON.stringify(users));
    if (window.FIRESTORE_ENABLED) {
      this.initFirestore().then(() => this._saveFirestoreDoc('users', 'users', users));
    }
  },

  // Retrieve alters, seeding sample ones for john_doe initially
  getAlters() {
    const normalize = (alter) => ({
      profileImage: '',
      profileBanner: '',
      profileDescription: '',
      profileThemeColor: '#6366f1',
      frontingRole: 'Inactive',
      mood: 3,
      energy: 3,
      frontingNotes: '',
      systemStatus: 'Active',
      alterInfo: {},
      interactionTags: [],
      ...alter,
      roles: alter.roles || (alter.category ? [alter.category] : ['Other'])
    });

    const data = localStorage.getItem('plural_alters');
    if (!data) {
      const defaults = [
        { altername: 'Alex', description: 'System host, organized and calm. Loves coffee and reading.', prn: 'they/them', category: 'Host', status: 'Fronting', user: 'john_doe', timestamp: new Date().toISOString() },
        { altername: 'Luna', description: 'Protector, quiet, protective of the system. Nocturnal schedule.', prn: 'she/her', category: 'Protector', status: 'Inactive', user: 'john_doe', timestamp: new Date().toISOString() }
      ].map(normalize);
      localStorage.setItem('plural_alters', JSON.stringify(defaults));
      if (window.FIRESTORE_ENABLED) {
        this.initFirestore().then(() => this._saveFirestoreDoc('alters', 'alters', defaults));
      }
      return defaults;
    }
    return JSON.parse(data).map(normalize);
  },

  saveAlters(alters) {
    localStorage.setItem('plural_alters', JSON.stringify(alters));
    if (window.FIRESTORE_ENABLED) {
      this.initFirestore().then(() => this._saveFirestoreDoc('alters', 'alters', alters));
    }
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
      if (window.FIRESTORE_ENABLED) {
        this.initFirestore().then(() => this._saveFirestoreDoc('fronters', 'fronters', defaults));
      }
      return defaults;
    }
    return JSON.parse(data);
  },

  saveFronters(fronters) {
    localStorage.setItem('plural_fronters', JSON.stringify(fronters));
    if (window.FIRESTORE_ENABLED) {
      this.initFirestore().then(() => this._saveFirestoreDoc('fronters', 'fronters', fronters));
    }
  },

  getFolders() {
    const data = localStorage.getItem('plural_alter_folders');
    if (!data) {
      const defaults = [];
      localStorage.setItem('plural_alter_folders', JSON.stringify(defaults));
      if (window.FIRESTORE_ENABLED) {
        this.initFirestore().then(() => this._saveFirestoreDoc('folders', 'folders', defaults));
      }
      return defaults;
    }
    return JSON.parse(data);
  },

  saveFolders(folders) {
    localStorage.setItem('plural_alter_folders', JSON.stringify(folders));
    if (window.FIRESTORE_ENABLED) {
      this.initFirestore().then(() => this._saveFirestoreDoc('folders', 'folders', folders));
    }
  },

  getSettings() {
    const data = localStorage.getItem('plural_settings');
    const defaults = {
      hideFolders: false,
      hideFolderedAlters: false,
      frontingRoles: ['Front', 'Co-front', 'Co-conscious', 'Background'],
      alterRoles: ['Host', 'Protector', 'Caregiver', 'Persecutor', 'Little', 'Other'],
      alterInfoTemplates: [
        { name: 'Alter Info', fields: ['Full Name', 'Age', 'Gender', 'Sexuality', 'Boundaries', 'Birthday', 'Likes', 'Dislikes'] },
        { name: 'System', fields: ['System Status', 'Triggers', 'Alter Type', 'Source'] }
      ],
      interactionStatuses: ['Int', 'DNI', 'IAYOR', 'IWEC'],
      highContrastMode: false,
      customAccentColor: '',
      dyslexiaFont: false,
      language: 'en'
    };
    if (!data) {
      localStorage.setItem('plural_settings', JSON.stringify(defaults));
      if (window.FIRESTORE_ENABLED) {
        this.initFirestore().then(() => this._saveFirestoreDoc('settings', 'settings', defaults));
      }
      return defaults;
    }
    try {
      return { ...defaults, ...JSON.parse(data) };
    } catch (err) {
      localStorage.setItem('plural_settings', JSON.stringify(defaults));
      return defaults;
    }
  },

  saveSettings(settings) {
    localStorage.setItem('plural_settings', JSON.stringify(settings));
    if (window.FIRESTORE_ENABLED) {
      this.initFirestore().then(() => this._saveFirestoreDoc('settings', 'settings', settings));
    }
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

  updateAccount(username, updates) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (userIndex === -1) return { success: false, message: 'User not found.' };

    const oldUsername = users[userIndex].username;
    const newUsername = (updates.username || '').trim();

    // Check uniqueness if username is changing
    if (newUsername && newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
      const exists = users.some(u => u.username.toLowerCase() === newUsername.toLowerCase());
      if (exists) return { success: false, message: 'Username is already taken.' };
      // Cascade username change to all related data
      const alters = this.getAlters();
      alters.forEach(alter => {
        if (alter.user.toLowerCase() === oldUsername.toLowerCase()) {
          alter.user = newUsername;
        }
      });
      this.saveAlters(alters);

      const fronters = this.getFronters();
      if (fronters[oldUsername] !== undefined) {
        fronters[newUsername] = fronters[oldUsername];
        delete fronters[oldUsername];
      }
      this.saveFronters(fronters);

      const folders = this.getFolders();
      folders.forEach(folder => {
        if (folder.user && folder.user.toLowerCase() === oldUsername.toLowerCase()) {
          folder.user = newUsername;
        }
      });
      this.saveFolders(folders);

      localStorage.setItem('plural_current_user', newUsername);
    }

    // Apply updates
    users[userIndex] = { ...users[userIndex], ...updates, username: newUsername || oldUsername };
    this.saveUsers(users);
    return { success: true, user: users[userIndex] };
  },

  login(username, password) {
    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (user) {
      localStorage.setItem('plural_current_user', user.username);
      // Save last username for convenience on re-login
      localStorage.setItem('plural_last_username', user.username);
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

  themeKey: 'plural_theme',

  getTheme() {
    return localStorage.getItem(this.themeKey) || 'dark';
  },

  saveTheme(theme) {
    const selected = theme === 'light' ? 'light' : 'dark';
    localStorage.setItem(this.themeKey, selected);
    this.applyTheme(selected);
    return selected;
  },

  toggleTheme() {
    const nextTheme = this.getTheme() === 'light' ? 'dark' : 'light';
    const result = this.saveTheme(nextTheme);
    return result;
  },

  applyTheme(theme = null) {
    const activeTheme = theme || this.getTheme();
    const body = document.body;
    if (!body) return;

    body.classList.toggle('light-theme', activeTheme === 'light');
    body.classList.toggle('dark-theme', activeTheme === 'dark');
  },

  applyAccessibility() {
    const settings = this.getSettings();
    const body = document.body;
    if (!body) return;

    // High contrast / colorblind mode
    body.classList.toggle('high-contrast', !!settings.highContrastMode);

    // Custom accent color
    if (settings.customAccentColor) {
      body.style.setProperty('--accent-primary', settings.customAccentColor);
      // Generate a slightly darker secondary
      body.style.setProperty('--accent-secondary', this._darkenColor(settings.customAccentColor, 20));
      body.style.setProperty('--accent-glow', settings.customAccentColor + '33');
    } else {
      body.style.removeProperty('--accent-primary');
      body.style.removeProperty('--accent-secondary');
      body.style.removeProperty('--accent-glow');
    }

    // Dyslexia-safe font
    body.classList.toggle('dyslexia-font', !!settings.dyslexiaFont);
  },

  _darkenColor(hex, amount) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = Math.max(0, parseInt(c.substring(0,2), 16) - amount);
    const g = Math.max(0, parseInt(c.substring(2,4), 16) - amount);
    const b = Math.max(0, parseInt(c.substring(4,6), 16) - amount);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  },

  initAccessibility() {
    window.addEventListener('DOMContentLoaded', () => this.applyAccessibility());
  },

  bindThemeToggle() {
    const toggleButton = document.getElementById('theme-toggle');
    if (!toggleButton) return;

    const updateLabel = (theme) => {
      toggleButton.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
    };

    updateLabel(this.getTheme());
    toggleButton.addEventListener('click', () => {
      const nextTheme = this.toggleTheme();
      updateLabel(nextTheme);
    });
  },

  initStickyTheme() {
    window.addEventListener('DOMContentLoaded', () => {
      this.applyTheme();
      this.applyAccessibility();
      this.bindThemeToggle();
    });
  },

  checkAuth(isLoginPage = false) {
    let currentUser = this.getCurrentUser();
    const inPagesDir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
    const previewMode = new URLSearchParams(window.location.search).get('preview') === 'true';

    if (!currentUser && previewMode && !isLoginPage) {
      const previewUser = 'john_doe';
      const users = this.getUsers();
      if (!users.some(user => user.username.toLowerCase() === previewUser.toLowerCase())) {
        users.push({ username: previewUser, email: 'preview@systemcloud.local', password: 'preview' });
        this.saveUsers(users);
      }
      localStorage.setItem('plural_current_user', previewUser);
      currentUser = previewUser;
    }

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

  // Simple markdown to HTML renderer (safe: escapes HTML first)
  renderMarkdown(text) {
    if (!text) return '';
    let html = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="markdown-link">$1 <span class="link-indicator">↗</span></a>');
    html = html.replace(/\n/g, '<br>');
    return html;
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

// Seed database immediately on script parse and start Firestore if configured.
DB.getUsers();
DB.getAlters();
DB.getFronters();
if (window.FIRESTORE_ENABLED) {
  DB.initFirestore();
}
DB.initStickyTheme();

// ── PWA Install handler ──
DB._deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  DB._deferredInstallPrompt = event;
  document.querySelectorAll('.btn-install-pwa').forEach(btn => btn.style.display = 'inline-flex');
});
window.addEventListener('appinstalled', () => {
  DB._deferredInstallPrompt = null;
  document.querySelectorAll('.btn-install-pwa').forEach(btn => btn.style.display = 'none');
});
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-install-pwa');
  if (!btn || !DB._deferredInstallPrompt) return;
  DB._deferredInstallPrompt.prompt();
  DB._deferredInstallPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      document.querySelectorAll('.btn-install-pwa').forEach(b => b.style.display = 'none');
    }
    DB._deferredInstallPrompt = null;
  });
});

// ── Download backup function ──
function downloadAppBackup() {
  const data = {
    users: DB.getUsers(),
    alters: DB.getAlters(),
    fronters: DB.getFronters(),
    folders: DB.getFolders(),
    settings: DB.getSettings(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system-cloud-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  DB.showToast('Backup downloaded.', 'success');
}
