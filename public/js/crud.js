// CRUD Operations Controller for Students, Skills, Projects, Interests & Relationships
const CrudView = {
  currentSubtab: 'crudStudents',

  init() {
    this.bindEvents();
    this.renderAll();
  },

  bindEvents() {
    // Subtab switching
    document.querySelectorAll('.crud-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        const subtab = btn.getAttribute('data-subtab');
        this.switchSubtab(subtab);
      });
    });

    // Open Add Modals
    document.getElementById('btnOpenAddStudent').addEventListener('click', () => {
      document.getElementById('formStudent').reset();
      document.getElementById('studentId').value = '';
      document.getElementById('modalStudentTitle').textContent = 'Add Student';
      App.openModal('modalStudent');
    });

    document.getElementById('btnOpenAddSkill').addEventListener('click', () => {
      document.getElementById('formSkill').reset();
      document.getElementById('skillId').value = '';
      document.getElementById('modalSkillTitle').textContent = 'Add Skill';
      App.openModal('modalSkill');
    });

    document.getElementById('btnOpenAddProject').addEventListener('click', () => {
      document.getElementById('formProject').reset();
      document.getElementById('projectId').value = '';
      document.getElementById('modalProjectTitle').textContent = 'Add Project';
      App.openModal('modalProject');
    });

    document.getElementById('btnOpenAddInterest').addEventListener('click', () => {
      document.getElementById('formInterest').reset();
      App.openModal('modalInterest');
    });

    // Form Submissions
    document.getElementById('formStudent').addEventListener('submit', (e) => this.handleSaveStudent(e));
    document.getElementById('formSkill').addEventListener('submit', (e) => this.handleSaveSkill(e));
    document.getElementById('formProject').addEventListener('submit', (e) => this.handleSaveProject(e));
    document.getElementById('formInterest').addEventListener('submit', (e) => this.handleSaveInterest(e));
    document.getElementById('formCreateRelationship').addEventListener('submit', (e) => this.handleCreateRelationship(e));

    // Dynamic relationship form updater
    const relTypeSelect = document.getElementById('relType');
    if (relTypeSelect) {
      relTypeSelect.addEventListener('change', () => this.updateRelationshipFormFields());
    }
  },

  switchSubtab(subtabId) {
    this.currentSubtab = subtabId;
    document.querySelectorAll('.crud-subtab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-subtab') === subtabId);
    });
    document.querySelectorAll('.crud-panel').forEach(p => {
      p.classList.toggle('active', p.id === subtabId);
    });

    if (subtabId === 'crudRelationships') {
      this.updateRelationshipFormFields();
      this.renderRelationships();
    }
  },

  renderAll() {
    this.renderStudents();
    this.renderSkills();
    this.renderProjects();
    this.renderInterests();
    this.renderRelationships();
  },

  // 1. STUDENTS CRUD
  renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;

    if (App.state.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No students found</td></tr>';
      return;
    }

    tbody.innerHTML = App.state.students.map(s => {
      const skillsHtml = (s.skills || [])
        .map(sk => `<span class="tag-badge" style="background:var(--skill-bg); color:#34d399;">${sk.name}</span>`)
        .join('');

      const projectsHtml = (s.projects || [])
        .map(p => `<span class="tag-badge" style="background:var(--project-bg); color:#a78bfa;">${p.title}</span>`)
        .join('');

      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            ${s.email ? `<div style="font-size:0.75rem; color:var(--text-muted);">${s.email}</div>` : ''}
          </td>
          <td>${s.major || 'Undeclared'} <br><small style="color:var(--text-muted);">${s.year || ''}</small></td>
          <td>${s.careerGoal || '—'}</td>
          <td style="max-width: 200px;">${skillsHtml || '<span style="color:var(--text-muted)">—</span>'}</td>
          <td style="max-width: 200px;">${projectsHtml || '<span style="color:var(--text-muted)">—</span>'}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-secondary btn-sm" onclick="CrudView.openEditStudent('${s.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="CrudView.deleteStudent('${s.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async handleSaveStudent(e) {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const payload = {
      name: document.getElementById('studentName').value.trim(),
      email: document.getElementById('studentEmail').value.trim(),
      major: document.getElementById('studentMajor').value.trim(),
      year: document.getElementById('studentYear').value,
      careerGoal: document.getElementById('studentCareerGoal').value.trim(),
      bio: document.getElementById('studentBio').value.trim()
    };

    try {
      if (id) {
        // Update
        const res = await App.fetchApi(`/api/students/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) App.showToast('Student updated successfully');
      } else {
        // Create
        const res = await App.fetchApi('/api/students', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) App.showToast('Student added successfully');
      }

      App.closeModal('modalStudent');
      await App.refreshAll();
    } catch (err) {
      App.showToast('Failed to save student', 'error');
    }
  },

  openEditStudent(id) {
    const s = App.state.students.find(item => item.id === id);
    if (!s) return;

    document.getElementById('studentId').value = s.id;
    document.getElementById('studentName').value = s.name || '';
    document.getElementById('studentEmail').value = s.email || '';
    document.getElementById('studentMajor').value = s.major || '';
    document.getElementById('studentYear').value = s.year || 'Junior';
    document.getElementById('studentCareerGoal').value = s.careerGoal || '';
    document.getElementById('studentBio').value = s.bio || '';
    document.getElementById('modalStudentTitle').textContent = `Edit Student: ${s.name}`;

    App.openModal('modalStudent');
  },

  async deleteStudent(id) {
    const s = App.state.students.find(item => item.id === id);
    if (!confirm(`Delete student "${s ? s.name : id}" and all their graph connections?`)) return;

    try {
      const res = await App.fetchApi(`/api/students/${id}`, { method: 'DELETE' });
      if (res.success) {
        App.showToast('Student removed from graph database');
        await App.refreshAll();
      }
    } catch (e) {
      App.showToast('Failed to delete student', 'error');
    }
  },

  // 2. SKILLS CRUD
  renderSkills() {
    const tbody = document.getElementById('skillsTableBody');
    if (!tbody) return;

    tbody.innerHTML = App.state.skills.map(sk => `
      <tr>
        <td><strong>${sk.name}</strong></td>
        <td><span class="tag-badge" style="background:var(--skill-bg); color:#34d399;">${sk.category || 'General'}</span></td>
        <td style="max-width: 250px; font-size:0.8rem; color:var(--text-secondary);">${sk.description || '—'}</td>
        <td><strong>${sk.studentCount || 0}</strong> students</td>
        <td>${sk.learnersCount || 0} students</td>
        <td>${sk.projectCount || 0} projects</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm" onclick="CrudView.openEditSkill('${sk.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="CrudView.deleteSkill('${sk.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async handleSaveSkill(e) {
    e.preventDefault();
    const id = document.getElementById('skillId').value;
    const payload = {
      name: document.getElementById('skillName').value.trim(),
      category: document.getElementById('skillCategory').value.trim(),
      description: document.getElementById('skillDescription').value.trim()
    };

    try {
      if (id) {
        await App.fetchApi(`/api/skills/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        App.showToast('Skill updated');
      } else {
        await App.fetchApi('/api/skills', { method: 'POST', body: JSON.stringify(payload) });
        App.showToast('Skill created');
      }
      App.closeModal('modalSkill');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to save skill', 'error');
    }
  },

  openEditSkill(id) {
    const sk = App.state.skills.find(item => item.id === id);
    if (!sk) return;

    document.getElementById('skillId').value = sk.id;
    document.getElementById('skillName').value = sk.name || '';
    document.getElementById('skillCategory').value = sk.category || '';
    document.getElementById('skillDescription').value = sk.description || '';
    document.getElementById('modalSkillTitle').textContent = `Edit Skill: ${sk.name}`;

    App.openModal('modalSkill');
  },

  async deleteSkill(id) {
    if (!confirm('Delete this skill and detach all relationships?')) return;
    try {
      await App.fetchApi(`/api/skills/${id}`, { method: 'DELETE' });
      App.showToast('Skill deleted');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to delete skill', 'error');
    }
  },

  // 3. PROJECTS CRUD
  renderProjects() {
    const tbody = document.getElementById('projectsTableBody');
    if (!tbody) return;

    tbody.innerHTML = App.state.projects.map(p => {
      const skillsHtml = (p.requiredSkills || [])
        .map(sk => `<span class="tag-badge" style="background:var(--skill-bg); color:#34d399;">${sk.name}</span>`)
        .join('');

      const contribsHtml = (p.contributors || [])
        .map(c => `<span class="tag-badge" style="background:var(--student-bg); color:#818cf8;">${c.student ? c.student.name : 'Student'} (${c.role})</span>`)
        .join('');

      return `
        <tr>
          <td>
            <strong>${p.title}</strong>
            ${p.githubUrl ? `<div style="font-size:0.75rem;"><a href="${p.githubUrl}" target="_blank" style="color:#818cf8;">GitHub ↗</a></div>` : ''}
          </td>
          <td>${p.domain || '—'}</td>
          <td><span class="tag-badge" style="background:var(--project-bg); color:#c4b5fd;">${p.status}</span></td>
          <td style="max-width: 200px;">${skillsHtml || '—'}</td>
          <td style="max-width: 200px;">${contribsHtml || '—'}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-secondary btn-sm" onclick="CrudView.openEditProject('${p.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="CrudView.deleteProject('${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async handleSaveProject(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const payload = {
      title: document.getElementById('projectTitle').value.trim(),
      domain: document.getElementById('projectDomain').value.trim(),
      status: document.getElementById('projectStatus').value,
      githubUrl: document.getElementById('projectGithub').value.trim(),
      description: document.getElementById('projectDescription').value.trim()
    };

    try {
      if (id) {
        await App.fetchApi(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        App.showToast('Project updated');
      } else {
        await App.fetchApi('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
        App.showToast('Project created');
      }
      App.closeModal('modalProject');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to save project', 'error');
    }
  },

  openEditProject(id) {
    const p = App.state.projects.find(item => item.id === id);
    if (!p) return;

    document.getElementById('projectId').value = p.id;
    document.getElementById('projectTitle').value = p.title || '';
    document.getElementById('projectDomain').value = p.domain || '';
    document.getElementById('projectStatus').value = p.status || 'Active';
    document.getElementById('projectGithub').value = p.githubUrl || '';
    document.getElementById('projectDescription').value = p.description || '';
    document.getElementById('modalProjectTitle').textContent = `Edit Project: ${p.title}`;

    App.openModal('modalProject');
  },

  async deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    try {
      await App.fetchApi(`/api/projects/${id}`, { method: 'DELETE' });
      App.showToast('Project deleted');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to delete project', 'error');
    }
  },

  // 4. INTERESTS CRUD
  renderInterests() {
    const tbody = document.getElementById('interestsTableBody');
    if (!tbody) return;

    tbody.innerHTML = App.state.interests.map(i => `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td><span class="tag-badge" style="background:var(--interest-bg); color:#fcd34d;">${i.category || 'General'}</span></td>
        <td><strong>${i.studentCount || 0}</strong> students</td>
        <td>${i.projectCount || 0} projects</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="CrudView.deleteInterest('${i.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  async handleSaveInterest(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('interestName').value.trim(),
      category: document.getElementById('interestCategory').value.trim()
    };

    try {
      await App.fetchApi('/api/interests', { method: 'POST', body: JSON.stringify(payload) });
      App.showToast('Interest created');
      App.closeModal('modalInterest');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to save interest', 'error');
    }
  },

  async deleteInterest(id) {
    if (!confirm('Delete this academic interest?')) return;
    try {
      await App.fetchApi(`/api/interests/${id}`, { method: 'DELETE' });
      App.showToast('Interest removed');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to delete interest', 'error');
    }
  },

  // 5. RELATIONSHIPS LINK BUILDER
  updateRelationshipFormFields() {
    const relType = document.getElementById('relType').value;
    const lblFrom = document.getElementById('lblRelFrom');
    const lblTo = document.getElementById('lblRelTo');
    const selectFrom = document.getElementById('relFrom');
    const selectTo = document.getElementById('relTo');
    const propsRow = document.getElementById('relPropsRow');
    const lblProp = document.getElementById('lblRelProp');
    const valProp = document.getElementById('relPropValue');

    selectFrom.innerHTML = '';
    selectTo.innerHTML = '';
    propsRow.style.display = 'flex';

    if (relType === 'HAS_SKILL' || relType === 'WANTS_TO_LEARN') {
      lblFrom.textContent = 'Student:';
      lblTo.textContent = 'Skill:';
      App.state.students.forEach(s => selectFrom.appendChild(new Option(s.name, s.id)));
      App.state.skills.forEach(sk => selectTo.appendChild(new Option(sk.name, sk.id)));

      if (relType === 'HAS_SKILL') {
        lblProp.textContent = 'Proficiency Level:';
        valProp.innerHTML = `
          <option value="Advanced">Advanced</option>
          <option value="Intermediate" selected>Intermediate</option>
          <option value="Beginner">Beginner</option>
        `;
      } else {
        propsRow.style.display = 'none';
      }
    } else if (relType === 'INTERESTED_IN') {
      lblFrom.textContent = 'Student:';
      lblTo.textContent = 'Interest:';
      App.state.students.forEach(s => selectFrom.appendChild(new Option(s.name, s.id)));
      App.state.interests.forEach(i => selectTo.appendChild(new Option(i.name, i.id)));
      propsRow.style.display = 'none';
    } else if (relType === 'WORKED_ON') {
      lblFrom.textContent = 'Student:';
      lblTo.textContent = 'Project:';
      App.state.students.forEach(s => selectFrom.appendChild(new Option(s.name, s.id)));
      App.state.projects.forEach(p => selectTo.appendChild(new Option(p.title, p.id)));
      lblProp.textContent = 'Role:';
      valProp.innerHTML = `
        <option value="Lead Developer">Lead Developer</option>
        <option value="Contributor" selected>Contributor</option>
        <option value="Researcher">Researcher</option>
        <option value="UI/UX Designer">UI/UX Designer</option>
      `;
    } else if (relType === 'REQUIRES_SKILL') {
      lblFrom.textContent = 'Project:';
      lblTo.textContent = 'Required Skill:';
      App.state.projects.forEach(p => selectFrom.appendChild(new Option(p.title, p.id)));
      App.state.skills.forEach(sk => selectTo.appendChild(new Option(sk.name, sk.id)));
      propsRow.style.display = 'none';
    } else if (relType === 'CONNECTED_TO') {
      lblFrom.textContent = 'Student 1:';
      lblTo.textContent = 'Student 2:';
      App.state.students.forEach(s => {
        selectFrom.appendChild(new Option(s.name, s.id));
        selectTo.appendChild(new Option(s.name, s.id));
      });
      propsRow.style.display = 'none';
    }
  },

  async handleCreateRelationship(e) {
    e.preventDefault();
    const type = document.getElementById('relType').value;
    const from = document.getElementById('relFrom').value;
    const to = document.getElementById('relTo').value;

    if (from === to) {
      App.showToast('Cannot connect a node to itself', 'error');
      return;
    }

    const props = {};
    if (type === 'HAS_SKILL') {
      props.proficiency = document.getElementById('relPropValue').value;
    } else if (type === 'WORKED_ON') {
      props.role = document.getElementById('relPropValue').value;
    } else if (type === 'CONNECTED_TO') {
      props.since = new Date().toISOString().split('T')[0];
    }

    try {
      const res = await App.fetchApi('/api/relationships', {
        method: 'POST',
        body: JSON.stringify({ from, to, type, props })
      });

      if (res.success) {
        App.showToast('Relationship edge created in Graph!');
        await App.refreshAll();
      }
    } catch (err) {
      App.showToast('Failed to create relationship', 'error');
    }
  },

  async renderRelationships() {
    const tbody = document.getElementById('relationshipsTableBody');
    if (!tbody) return;

    try {
      const graphRes = await App.fetchApi('/api/graph');
      if (!graphRes.success) return;

      const edges = graphRes.edges || [];
      const nodesMap = new Map((graphRes.nodes || []).map(n => [n.id, n]));

      tbody.innerHTML = edges.map(e => {
        const fromNode = nodesMap.get(e.from);
        const toNode = nodesMap.get(e.to);
        const fromName = fromNode ? `${fromNode.label} (${fromNode.group})` : e.from;
        const toName = toNode ? `${toNode.label} (${toNode.group})` : e.to;

        let propsText = '—';
        if (e.props && Object.keys(e.props).length > 0) {
          propsText = Object.entries(e.props).map(([k, v]) => `${k}: ${v}`).join(', ');
        }

        return `
          <tr>
            <td><strong>${fromName}</strong></td>
            <td><span class="tag-badge" style="background:var(--bg-subtle); color:#818cf8;">${e.type}</span></td>
            <td><strong>${toName}</strong></td>
            <td><small style="color:var(--text-secondary);">${propsText}</small></td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="CrudView.deleteRelationship('${e.from}', '${e.to}', '${e.type}')">
                Unlink
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.warn('Failed to load relationships table', e);
    }
  },

  async deleteRelationship(from, to, type) {
    if (!confirm(`Delete relationship ${type}?`)) return;
    try {
      await App.fetchApi('/api/relationships', {
        method: 'DELETE',
        body: JSON.stringify({ from, to, type })
      });
      App.showToast('Relationship edge unlinked');
      await App.refreshAll();
    } catch (e) {
      App.showToast('Failed to delete relationship', 'error');
    }
  },

  refresh() {
    this.renderAll();
  }
};
