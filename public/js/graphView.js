// Vis.js Interactive Graph Visualizer Controller
const GraphView = {
  network: null,
  nodesDataSet: null,
  edgesDataSet: null,
  allNodes: [],
  allEdges: [],
  physicsEnabled: true,

  init() {
    this.bindEvents();
    this.loadGraph();
  },

  bindEvents() {
    // Filter toggles
    ['Student', 'Skill', 'Project', 'Interest'].forEach(type => {
      const checkbox = document.getElementById(`filter${type}`);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          checkbox.parentElement.classList.toggle('active', checkbox.checked);
          this.applyFilters();
        });
      }
    });

    // Search Box
    const searchInput = document.getElementById('graphSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchNode(e.target.value.trim());
      });
    }

    // Fit Graph Button
    document.getElementById('btnFitGraph').addEventListener('click', () => {
      if (this.network) this.network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
    });

    // Toggle Physics Button
    document.getElementById('btnTogglePhysics').addEventListener('click', () => {
      this.physicsEnabled = !this.physicsEnabled;
      if (this.network) {
        this.network.setOptions({ physics: { enabled: this.physicsEnabled } });
        App.showToast(`Graph physics ${this.physicsEnabled ? 'enabled' : 'frozen'}`);
      }
    });

    // Close Node Drawer
    document.getElementById('btnCloseDrawer').addEventListener('click', () => {
      this.closeDrawer();
    });
  },

  async loadGraph() {
    const container = document.getElementById('visNetworkContainer');
    if (!container) return;

    try {
      const res = await App.fetchApi('/api/graph');
      if (!res.success) return;

      this.allNodes = res.nodes || [];
      this.allEdges = res.edges || [];

      // Format nodes for Vis.js
      const visNodes = this.allNodes.map(n => this.formatVisNode(n));

      // Format edges for Vis.js
      const visEdges = this.allEdges.map(e => this.formatVisEdge(e));

      this.nodesDataSet = new vis.DataSet(visNodes);
      this.edgesDataSet = new vis.DataSet(visEdges);

      const data = {
        nodes: this.nodesDataSet,
        edges: this.edgesDataSet
      };

      const options = {
        nodes: {
          font: { color: '#f8fafc', face: 'Inter', size: 12 },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          font: { color: '#94a3b8', size: 9, align: 'middle' },
          arrows: { to: { enabled: true, scaleFactor: 0.65 } },
          smooth: { type: 'continuous' },
          color: { color: '#334155', highlight: '#818cf8', hover: '#64748b' },
          width: 1.5
        },
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -3500,
            centralGravity: 0.35,
            springLength: 120,
            springConstant: 0.04,
            damping: 0.09
          },
          stabilization: { iterations: 120 }
        },
        interaction: {
          hover: true,
          tooltipDelay: 150,
          hideEdgesOnDrag: false,
          zoomView: true
        }
      };

      if (this.network) {
        this.network.destroy();
      }

      this.network = new vis.Network(container, data, options);

      // Handle Node Selection / Click
      this.network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const selectedId = params.nodes[0];
          this.showNodeDrawer(selectedId);
        } else {
          this.closeDrawer();
        }
      });

    } catch (err) {
      console.error('Failed to load graph visualization', err);
    }
  },

  formatVisNode(n) {
    let shape = 'dot';
    let size = 20;
    let color = {
      background: n.color || '#6366f1',
      border: '#ffffff',
      highlight: { background: n.color || '#6366f1', border: '#ffffff' }
    };

    switch (n.group) {
      case 'Student':
        shape = 'dot';
        size = 24;
        color = { background: n.color || '#6366f1', border: '#a5b4fc', highlight: { background: '#818cf8', border: '#fff' } };
        break;
      case 'Skill':
        shape = 'diamond';
        size = 18;
        color = { background: '#10b981', border: '#6ee7b7', highlight: { background: '#34d399', border: '#fff' } };
        break;
      case 'Project':
        shape = 'hexagon';
        size = 22;
        color = { background: '#8b5cf6', border: '#c4b5fd', highlight: { background: '#a78bfa', border: '#fff' } };
        break;
      case 'Interest':
        shape = 'triangle';
        size = 16;
        color = { background: '#f59e0b', border: '#fcd34d', highlight: { background: '#fbbf24', border: '#fff' } };
        break;
    }

    return {
      id: n.id,
      label: n.label,
      title: `${n.group}: ${n.label}${n.sublabel ? ' (' + n.sublabel + ')' : ''}`,
      group: n.group,
      shape,
      size,
      color,
      raw: n
    };
  },

  formatVisEdge(e) {
    const isWants = e.type === 'WANTS_TO_LEARN';
    const isConn = e.type === 'CONNECTED_TO';

    return {
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.label || e.type,
      arrows: isConn ? { to: false } : { to: { enabled: true, scaleFactor: 0.6 } },
      dashes: isWants,
      color: isWants ? { color: '#f59e0b' } : isConn ? { color: '#818cf8', width: 2 } : { color: '#475569' }
    };
  },

  applyFilters() {
    if (!this.nodesDataSet) return;

    const activeGroups = [];
    if (document.getElementById('filterStudent').checked) activeGroups.push('Student');
    if (document.getElementById('filterSkill').checked) activeGroups.push('Skill');
    if (document.getElementById('filterProject').checked) activeGroups.push('Project');
    if (document.getElementById('filterInterest').checked) activeGroups.push('Interest');

    const filteredNodes = this.allNodes
      .filter(n => activeGroups.includes(n.group))
      .map(n => this.formatVisNode(n));

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = this.allEdges
      .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
      .map(e => this.formatVisEdge(e));

    this.nodesDataSet.clear();
    this.nodesDataSet.add(filteredNodes);

    this.edgesDataSet.clear();
    this.edgesDataSet.add(filteredEdges);
  },

  searchNode(query) {
    if (!query || !this.network || !this.nodesDataSet) return;
    const lower = query.toLowerCase();
    const match = this.nodesDataSet.get().find(n => n.label.toLowerCase().includes(lower));
    if (match) {
      this.network.focus(match.id, {
        scale: 1.3,
        animation: { duration: 500, easingFunction: 'easeInOutQuad' }
      });
      this.network.selectNodes([match.id]);
      this.showNodeDrawer(match.id);
    }
  },

  showNodeDrawer(nodeId) {
    const node = this.allNodes.find(n => n.id === nodeId);
    if (!node) return;

    const drawer = document.getElementById('nodeDrawer');
    const badge = document.getElementById('drawerBadge');
    const title = document.getElementById('drawerTitle');
    const sub = document.getElementById('drawerSubtitle');
    const extra = document.getElementById('drawerExtra');
    const connContainer = document.getElementById('drawerConnections');
    const actions = document.getElementById('drawerActions');

    drawer.classList.add('open');
    badge.className = `drawer-badge badge-${node.group.toLowerCase()}`;
    badge.textContent = node.group;
    title.textContent = node.label;
    sub.textContent = node.sublabel || '';

    extra.innerHTML = '';
    actions.innerHTML = '';

    if (node.group === 'Student') {
      const student = App.state.students.find(s => s.id === nodeId);
      if (student) {
        extra.innerHTML = `
          <div><strong>Year:</strong> ${student.year || 'N/A'}</div>
          <div><strong>Career Goal:</strong> ${student.careerGoal || 'N/A'}</div>
          ${student.bio ? `<div style="margin-top:0.4rem; color:var(--text-secondary); font-style:italic;">"${student.bio}"</div>` : ''}
        `;
      }

      actions.innerHTML = `
        <button class="btn btn-primary btn-sm" onclick="RecommendView.selectStudent('${node.id}'); App.switchTab('recommendView');">
          View Recommendations for ${node.label} →
        </button>
      `;
    } else if (node.group === 'Skill') {
      const skill = App.state.skills.find(sk => sk.id === nodeId);
      if (skill && skill.description) {
        extra.innerHTML = `<div>${skill.description}</div>`;
      }
    } else if (node.group === 'Project') {
      const project = App.state.projects.find(p => p.id === nodeId);
      if (project) {
        extra.innerHTML = `
          <div><strong>Status:</strong> ${project.status}</div>
          <div style="margin-top:0.3rem;">${project.description || ''}</div>
          ${project.githubUrl ? `<div style="margin-top:0.4rem;"><a href="${project.githubUrl}" target="_blank" style="color:#818cf8;">View Source Repository ↗</a></div>` : ''}
        `;
      }
    }

    // Render Connected Edges
    const connectedEdges = this.allEdges.filter(e => e.from === nodeId || e.to === nodeId);
    if (connectedEdges.length === 0) {
      connContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem;">No connected edges</div>';
    } else {
      connContainer.innerHTML = connectedEdges.map(e => {
        const isSource = e.from === nodeId;
        const otherId = isSource ? e.to : e.from;
        const otherNode = this.allNodes.find(n => n.id === otherId);
        const otherName = otherNode ? otherNode.label : otherId;

        return `
          <div class="conn-item">
            <span class="conn-type">${e.type}</span>
            <span>${isSource ? '→' : '←'} <strong>${otherName}</strong></span>
          </div>
        `;
      }).join('');
    }
  },

  closeDrawer() {
    const drawer = document.getElementById('nodeDrawer');
    if (drawer) drawer.classList.remove('open');
  },

  refresh() {
    this.loadGraph();
  }
};
