// Student Networking & Recommendation Engine Controller
const RecommendView = {
  currentStudentId: null,

  init() {
    this.bindEvents();
    this.populateStudentSelect();
  },

  bindEvents() {
    const select = document.getElementById('selectRecommendStudent');
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectStudent(e.target.value);
      });
    }
  },

  populateStudentSelect() {
    const select = document.getElementById('selectRecommendStudent');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose a Student --</option>';

    App.state.students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.major} - ${s.year})`;
      select.appendChild(opt);
    });

    if (currentVal && App.state.students.some(s => s.id === currentVal)) {
      select.value = currentVal;
    } else if (App.state.students.length > 0 && !this.currentStudentId) {
      // Default to first student
      this.selectStudent(App.state.students[0].id);
    }
  },

  async selectStudent(studentId) {
    if (!studentId) {
      this.clearRecommendations();
      return;
    }

    this.currentStudentId = studentId;
    const select = document.getElementById('selectRecommendStudent');
    if (select && select.value !== studentId) {
      select.value = studentId;
    }

    // Render Student Header Summary
    const student = App.state.students.find(s => s.id === studentId);
    const summaryContainer = document.getElementById('selectedStudentSummary');
    if (student && summaryContainer) {
      const skillsHtml = (student.skills || [])
        .map(sk => `<span class="tag-badge" style="background:var(--skill-bg); color:#34d399;">${sk.name}</span>`)
        .join('');

      summaryContainer.innerHTML = `
        <div class="quick-badge"><strong>Goal:</strong> ${student.careerGoal || 'Software Development'}</div>
        <div class="quick-badge"><strong>Current Skills:</strong> ${skillsHtml || '<span style="color:var(--text-muted)">None listed</span>'}</div>
      `;
    }

    // Fetch and render recommendations
    await this.fetchAndRenderRecommendations(studentId);
  },

  async fetchAndRenderRecommendations(studentId) {
    const peersList = document.getElementById('peerRecommendationsList');
    const skillsList = document.getElementById('skillRecommendationsList');
    const projectsList = document.getElementById('projectRecommendationsList');

    peersList.innerHTML = '<div class="empty-state">Calculating graph similarities...</div>';
    skillsList.innerHTML = '<div class="empty-state">Analyzing peer skill topologies...</div>';
    projectsList.innerHTML = '<div class="empty-state">Evaluating project skill matches...</div>';

    try {
      const data = await App.fetchApi(`/api/recommendations/${studentId}`);
      if (!data.success) {
        throw new Error(data.error || 'Failed to load recommendations');
      }

      this.renderPeers(data.peers || []);
      this.renderSkills(data.skills || []);
      this.renderProjects(data.projects || []);

    } catch (err) {
      peersList.innerHTML = `<div class="empty-state error">Error: ${err.message}</div>`;
      skillsList.innerHTML = `<div class="empty-state error">Error: ${err.message}</div>`;
      projectsList.innerHTML = `<div class="empty-state error">Error: ${err.message}</div>`;
    }
  },

  renderPeers(peers) {
    const container = document.getElementById('peerRecommendationsList');
    if (peers.length === 0) {
      container.innerHTML = '<div class="empty-state">No peer recommendations found. Try adding more skills or interests.</div>';
      return;
    }

    container.innerHTML = peers.map(item => {
      const p = item.peer;
      const isHigh = item.matchPercent >= 65;

      // Mentorship insight
      let mentorInsight = '';
      if (item.canTeachSkills && item.canTeachSkills.length > 0) {
        mentorInsight += `<div>💡 <strong>Can teach you:</strong> ${item.canTeachSkills.join(', ')}</div>`;
      }
      if (item.canLearnSkills && item.canLearnSkills.length > 0) {
        mentorInsight += `<div>🤝 <strong>Interested in learning from you:</strong> ${item.canLearnSkills.join(', ')}</div>`;
      }

      return `
        <div class="rec-card">
          <div class="rec-header">
            <div>
              <div class="rec-title">${p.name}</div>
              <div class="rec-subtitle">${p.major} • ${p.year}</div>
            </div>
            <span class="score-badge ${isHigh ? 'high' : ''}">${item.matchPercent}% Match</span>
          </div>

          <div class="rec-reason-box">
            ${item.mutualInterests.length > 0 ? `<div>🎯 <strong>Shared Interests:</strong> ${item.mutualInterests.join(', ')}</div>` : ''}
            ${item.mutualSkills.length > 0 ? `<div>🛠 <strong>Shared Skills:</strong> ${item.mutualSkills.join(', ')}</div>` : ''}
            ${item.mutualProjects.length > 0 ? `<div>📁 <strong>Shared Projects:</strong> ${item.mutualProjects.join(', ')}</div>` : ''}
            ${mentorInsight}
          </div>

          <div class="rec-card-footer">
            ${item.isConnected 
              ? `<button class="btn btn-secondary btn-sm" disabled>✓ Connected</button>`
              : `<button class="btn btn-primary btn-sm" onclick="RecommendView.connectPeer('${p.id}')">+ Connect</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  },

  renderSkills(skills) {
    const container = document.getElementById('skillRecommendationsList');
    if (skills.length === 0) {
      container.innerHTML = '<div class="empty-state">No new skill recommendations. You have covered all skills in your peer network!</div>';
      return;
    }

    container.innerHTML = skills.map(item => {
      const sk = item.recSkill;
      return `
        <div class="rec-card">
          <div class="rec-header">
            <div>
              <div class="rec-title">${sk.name}</div>
              <div class="rec-subtitle">${sk.category || 'Technical Skill'}</div>
            </div>
            <span class="score-badge high">Score ${Math.round(item.relevanceScore)}</span>
          </div>

          <div class="rec-reason-box">
            ${item.peerCount > 0 ? `<div>👥 Held by <strong>${item.peerCount} peers</strong> with similar interests (${item.peerExamples.join(', ')})</div>` : ''}
            ${item.projectCount > 0 ? `<div>🚀 In-demand for <strong>${item.projectCount} projects</strong> in your field (${item.projectExamples.join(', ')})</div>` : ''}
            ${item.relatedInterests.length > 0 ? `<div>📌 Relevant to: ${item.relatedInterests.join(', ')}</div>` : ''}
          </div>

          <div class="rec-card-footer">
            ${item.isAlreadyTargeted
              ? `<button class="btn btn-secondary btn-sm" disabled>✓ In Learning Goals</button>`
              : `<button class="btn btn-primary btn-sm" onclick="RecommendView.addLearningSkill('${sk.id}')">+ Add to Learning Goals</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  },

  renderProjects(projects) {
    const container = document.getElementById('projectRecommendationsList');
    if (projects.length === 0) {
      container.innerHTML = '<div class="empty-state">No matching projects found. Create or explore projects in the CRUD tab.</div>';
      return;
    }

    container.innerHTML = projects.map(item => {
      const prj = item.project;
      const isHigh = item.matchPercent >= 60;

      const matchingBadges = (item.matchedSkillNames || [])
        .map(name => `<span class="tag-badge" style="background:var(--skill-bg); color:#34d399;">✓ ${name}</span>`)
        .join('');

      const learningBadges = (item.learningSkillNames || [])
        .map(name => `<span class="tag-badge" style="background:var(--interest-bg); color:#fbbf24;">⚡ Practice: ${name}</span>`)
        .join('');

      return `
        <div class="rec-card">
          <div class="rec-header">
            <div>
              <div class="rec-title">${prj.title}</div>
              <div class="rec-subtitle">${prj.domain || 'Project'} • <span style="color:#a78bfa;">${prj.status}</span></div>
            </div>
            <span class="score-badge ${isHigh ? 'high' : ''}">${item.matchPercent}% Fit</span>
          </div>

          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem;">${prj.description || ''}</p>

          <div class="rec-reason-box">
            <div><strong>Skills You Bring:</strong> ${matchingBadges || '<span style="color:var(--text-muted)">None yet</span>'}</div>
            ${learningBadges ? `<div style="margin-top:0.3rem;"><strong>Learning Opportunity:</strong> ${learningBadges}</div>` : ''}
            ${item.matchedInterests && item.matchedInterests.length > 0 ? `<div style="margin-top:0.3rem;">🎯 Aligns with interest in: ${item.matchedInterests.join(', ')}</div>` : ''}
          </div>

          <div class="rec-card-footer">
            <button class="btn btn-primary btn-sm" onclick="RecommendView.joinProject('${prj.id}')">
              Join Project Team
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // Instant Relationship Actions
  async connectPeer(peerId) {
    if (!this.currentStudentId) return;
    try {
      const res = await App.fetchApi('/api/relationships', {
        method: 'POST',
        body: JSON.stringify({
          from: this.currentStudentId,
          to: peerId,
          type: 'CONNECTED_TO',
          props: { since: new Date().toISOString().split('T')[0] }
        })
      });

      if (res.success) {
        App.showToast('Connected with peer! Graph updated.', 'success');
        await App.loadAllData();
        await this.selectStudent(this.currentStudentId);
        GraphView.refresh();
      }
    } catch (e) {
      App.showToast('Failed to connect with peer', 'error');
    }
  },

  async addLearningSkill(skillId) {
    if (!this.currentStudentId) return;
    try {
      const res = await App.fetchApi('/api/relationships', {
        method: 'POST',
        body: JSON.stringify({
          from: this.currentStudentId,
          to: skillId,
          type: 'WANTS_TO_LEARN'
        })
      });

      if (res.success) {
        App.showToast('Skill added to learning goals!', 'success');
        await App.loadAllData();
        await this.selectStudent(this.currentStudentId);
        GraphView.refresh();
      }
    } catch (e) {
      App.showToast('Failed to add skill', 'error');
    }
  },

  async joinProject(projectId) {
    if (!this.currentStudentId) return;
    const role = prompt('Enter your role for this project:', 'Contributor') || 'Contributor';
    try {
      const res = await App.fetchApi('/api/relationships', {
        method: 'POST',
        body: JSON.stringify({
          from: this.currentStudentId,
          to: projectId,
          type: 'WORKED_ON',
          props: { role }
        })
      });

      if (res.success) {
        App.showToast(`Joined project as ${role}!`, 'success');
        await App.loadAllData();
        await this.selectStudent(this.currentStudentId);
        GraphView.refresh();
      }
    } catch (e) {
      App.showToast('Failed to join project', 'error');
    }
  },

  clearRecommendations() {
    document.getElementById('selectedStudentSummary').innerHTML = '';
    document.getElementById('peerRecommendationsList').innerHTML = '<div class="empty-state">Select a student above.</div>';
    document.getElementById('skillRecommendationsList').innerHTML = '<div class="empty-state">Select a student above.</div>';
    document.getElementById('projectRecommendationsList').innerHTML = '<div class="empty-state">Select a student above.</div>';
  },

  refresh() {
    this.populateStudentSelect();
    if (this.currentStudentId) {
      this.selectStudent(this.currentStudentId);
    }
  }
};
