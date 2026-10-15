// Main Application Controller & State
const App = {
  state: {
    activeTab: 'graphView',
    engineStatus: 'in-memory',
    students: [],
    skills: [],
    projects: [],
    interests: [],
    selectedStudentId: null
  },

  // API helper
  async fetchApi(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      return await res.json();
    } catch (err) {
      console.error(`API Error (${url}):`, err);
      App.showToast(`Network error: ${err.message}`, 'error');
      throw err;
    }
  },

  // Show Toast
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  // Initialize App
  async init() {
    this.bindEvents();
    await this.refreshStatus();
    await this.loadAllData();
    GraphView.init();
    RecommendView.init();
    CrudView.init();
    CypherConsole.init();
  },

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Neo4j Settings Button & Modal
    document.getElementById('btnNeo4jSettings').addEventListener('click', () => {
      this.openModal('modalNeo4j');
    });

    document.getElementById('engineStatusBadge').addEventListener('click', () => {
      this.openModal('modalNeo4j');
    });

    // Close Modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        this.closeModal(modalId);
      });
    });

    // Neo4j Config Form Submit
    document.getElementById('formNeo4jConfig').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveNeo4jConfig();
    });

    // Reset / Seed Data Button
    document.getElementById('btnSeedData').addEventListener('click', async () => {
      if (confirm('Reset graph database to default sample dataset? Any unsaved edits will be refreshed.')) {
        await this.seedData();
      }
    });
  },

  switchTab(tabId) {
    App.state.activeTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    // Update Panes
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    // Trigger tab-specific refresh
    if (tabId === 'graphView') {
      GraphView.refresh();
    } else if (tabId === 'recommendView') {
      RecommendView.refresh();
    } else if (tabId === 'crudView') {
      CrudView.refresh();
    }
  },

  // Refresh Engine & Stats Status
  async refreshStatus() {
    try {
      const data = await this.fetchApi('/api/status');
      if (data && data.success) {
        App.state.engineStatus = data.activeEngine;
        const badge = document.getElementById('engineStatusBadge');
        const text = document.getElementById('engineStatusText');

        if (data.activeEngine === 'neo4j' && data.neo4j && data.neo4j.isConnected) {
          badge.className = 'status-badge neo4j-connected';
          text.textContent = 'Neo4j Connected';
        } else {
          badge.className = 'status-badge in-memory';
          text.textContent = 'In-Memory Graph';
        }

        // Update stats
        if (data.stats) {
          document.getElementById('statStudents').textContent = data.stats.studentsCount || 0;
          document.getElementById('statSkills').textContent = data.stats.skillsCount || 0;
          document.getElementById('statProjects').textContent = data.stats.projectsCount || 0;
          document.getElementById('statInterests').textContent = data.stats.interestsCount || 0;
          document.getElementById('statRels').textContent = data.stats.totalRelationships || 0;
        }
      }
    } catch (e) {
      console.warn('Failed to load status', e);
    }
  },

  // Load all foundational data
  async loadAllData() {
    try {
      const [studentsRes, skillsRes, projectsRes, interestsRes] = await Promise.all([
        this.fetchApi('/api/students'),
        this.fetchApi('/api/skills'),
        this.fetchApi('/api/projects'),
        this.fetchApi('/api/interests')
      ]);

      if (studentsRes.success) App.state.students = studentsRes.students;
      if (skillsRes.success) App.state.skills = skillsRes.skills;
      if (projectsRes.success) App.state.projects = projectsRes.projects;
      if (interestsRes.success) App.state.interests = interestsRes.interests;
    } catch (e) {
      console.error('Error loading core data', e);
    }
  },

  // Save Neo4j Configuration & Connect
  async saveNeo4jConfig() {
    const alertBox = document.getElementById('neoTestAlert');
    alertBox.style.display = 'block';
    alertBox.className = 'alert-box';
    alertBox.textContent = 'Connecting to Neo4j instance...';

    const payload = {
      uri: document.getElementById('neoUri').value.trim(),
      user: document.getElementById('neoUser').value.trim(),
      password: document.getElementById('neoPassword').value,
      database: document.getElementById('neoDatabase').value.trim(),
      syncData: document.getElementById('neoSyncData').checked
    };

    try {
      const res = await this.fetchApi('/api/config/neo4j', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.connected) {
        alertBox.className = 'alert-box success';
        alertBox.textContent = res.message;
        App.showToast('Successfully connected to Neo4j!', 'success');
        setTimeout(() => {
          this.closeModal('modalNeo4j');
          this.refreshAll();
        }, 1200);
      } else {
        alertBox.className = 'alert-box error';
        alertBox.textContent = res.message;
        App.showToast(`Connection failed: ${res.error}`, 'error');
      }
    } catch (err) {
      alertBox.className = 'alert-box error';
      alertBox.textContent = err.message;
    }
  },

  // Seed sample data
  async seedData() {
    try {
      const res = await this.fetchApi('/api/seed', { method: 'POST' });
      if (res.success) {
        this.showToast('Graph data refreshed with sample university network!', 'success');
        await this.refreshAll();
      }
    } catch (e) {
      this.showToast('Failed to seed graph data', 'error');
    }
  },

  // Refresh entire application views
  async refreshAll() {
    await this.refreshStatus();
    await this.loadAllData();
    GraphView.refresh();
    RecommendView.refresh();
    CrudView.refresh();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
