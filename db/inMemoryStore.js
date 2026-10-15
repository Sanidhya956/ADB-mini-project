// In-memory Graph Engine implementing graph traversal and recommendation algorithms
const SEED_DATA = require('./seedData');

class InMemoryGraph {
  constructor() {
    this.reset();
  }

  reset() {
    this.students = new Map();
    this.skills = new Map();
    this.projects = new Map();
    this.interests = new Map();
    // Edges list: [{ id, from, to, type, props }]
    this.edges = [];
    this.seed();
  }

  seed() {
    SEED_DATA.students.forEach(s => this.students.set(s.id, { ...s }));
    SEED_DATA.skills.forEach(sk => this.skills.set(sk.id, { ...sk }));
    SEED_DATA.projects.forEach(p => this.projects.set(p.id, { ...p }));
    SEED_DATA.interests.forEach(i => this.interests.set(i.id, { ...i }));
    this.edges = SEED_DATA.relationships.map((r, idx) => ({
      id: `edge_${idx}`,
      from: r.from,
      to: r.to,
      type: r.type,
      props: r.props || {}
    }));
  }

  // --- STATS & GRAPH PAYLOAD ---
  getStats() {
    return {
      studentsCount: this.students.size,
      skillsCount: this.skills.size,
      projectsCount: this.projects.size,
      interestsCount: this.interests.size,
      totalNodes: this.students.size + this.skills.size + this.projects.size + this.interests.size,
      totalRelationships: this.edges.length
    };
  }

  getFullGraph() {
    const nodes = [];
    
    this.students.forEach(s => {
      nodes.push({
        id: s.id,
        label: s.name,
        group: 'Student',
        sublabel: s.major,
        year: s.year,
        careerGoal: s.careerGoal,
        color: s.avatarColor || '#6366f1'
      });
    });

    this.skills.forEach(sk => {
      nodes.push({
        id: sk.id,
        label: sk.name,
        group: 'Skill',
        sublabel: sk.category,
        description: sk.description,
        color: '#10b981'
      });
    });

    this.projects.forEach(p => {
      nodes.push({
        id: p.id,
        label: p.title,
        group: 'Project',
        sublabel: p.domain,
        status: p.status,
        color: '#8b5cf6'
      });
    });

    this.interests.forEach(i => {
      nodes.push({
        id: i.id,
        label: i.name,
        group: 'Interest',
        sublabel: i.category,
        color: '#f59e0b'
      });
    });

    const edges = this.edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      label: e.type,
      type: e.type,
      props: e.props
    }));

    return { nodes, edges };
  }

  // --- STUDENT CRUD ---
  getAllStudents() {
    return Array.from(this.students.values()).map(s => this.enrichStudent(s.id));
  }

  getStudentById(id) {
    if (!this.students.has(id)) return null;
    return this.enrichStudent(id);
  }

  enrichStudent(id) {
    const student = { ...this.students.get(id) };
    
    // Skills
    student.skills = this.edges
      .filter(e => e.from === id && e.type === 'HAS_SKILL' && this.skills.has(e.to))
      .map(e => {
        const sk = this.skills.get(e.to);
        return {
          id: sk.id,
          name: sk.name,
          category: sk.category,
          proficiency: e.props.proficiency || 'Intermediate'
        };
      });

    // Wants to learn
    student.wantsToLearn = this.edges
      .filter(e => e.from === id && e.type === 'WANTS_TO_LEARN' && this.skills.has(e.to))
      .map(e => {
        const sk = this.skills.get(e.to);
        return { id: sk.id, name: sk.name, category: sk.category };
      });

    // Projects
    student.projects = this.edges
      .filter(e => e.from === id && e.type === 'WORKED_ON' && this.projects.has(e.to))
      .map(e => {
        const p = this.projects.get(e.to);
        return { id: p.id, title: p.title, role: e.props.role || 'Contributor' };
      });

    // Interests
    student.interests = this.edges
      .filter(e => e.from === id && e.type === 'INTERESTED_IN' && this.interests.has(e.to))
      .map(e => {
        const i = this.interests.get(e.to);
        return { id: i.id, name: i.name, category: i.category };
      });

    // Connected peers (bidirectional check)
    const connSet = new Set();
    this.edges.forEach(e => {
      if (e.type === 'CONNECTED_TO') {
        if (e.from === id && this.students.has(e.to)) connSet.add(e.to);
        if (e.to === id && this.students.has(e.from)) connSet.add(e.from);
      }
    });

    student.connections = Array.from(connSet).map(peerId => {
      const p = this.students.get(peerId);
      return { id: p.id, name: p.name, major: p.major };
    });

    return student;
  }

  createStudent(data) {
    const id = data.id || `std_${Date.now()}`;
    const student = {
      id,
      name: data.name,
      email: data.email || '',
      major: data.major || 'Computer Science',
      year: data.year || 'Junior',
      bio: data.bio || '',
      careerGoal: data.careerGoal || 'Software Engineer',
      avatarColor: data.avatarColor || '#6366f1'
    };
    this.students.set(id, student);

    // Initial skills if provided
    if (Array.isArray(data.skillIds)) {
      data.skillIds.forEach(skId => {
        this.addRelationship(id, skId, 'HAS_SKILL', { proficiency: 'Intermediate' });
      });
    }

    // Initial interests if provided
    if (Array.isArray(data.interestIds)) {
      data.interestIds.forEach(iId => {
        this.addRelationship(id, iId, 'INTERESTED_IN');
      });
    }

    return this.enrichStudent(id);
  }

  updateStudent(id, data) {
    if (!this.students.has(id)) return null;
    const existing = this.students.get(id);
    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      email: data.email !== undefined ? data.email : existing.email,
      major: data.major !== undefined ? data.major : existing.major,
      year: data.year !== undefined ? data.year : existing.year,
      bio: data.bio !== undefined ? data.bio : existing.bio,
      careerGoal: data.careerGoal !== undefined ? data.careerGoal : existing.careerGoal,
      avatarColor: data.avatarColor !== undefined ? data.avatarColor : existing.avatarColor
    };
    this.students.set(id, updated);
    return this.enrichStudent(id);
  }

  deleteStudent(id) {
    if (!this.students.has(id)) return false;
    this.students.delete(id);
    // Cascade delete edges
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    return true;
  }

  // --- SKILL CRUD ---
  getAllSkills() {
    return Array.from(this.skills.values()).map(sk => {
      const studentCount = this.edges.filter(e => e.to === sk.id && e.type === 'HAS_SKILL').length;
      const learnersCount = this.edges.filter(e => e.to === sk.id && e.type === 'WANTS_TO_LEARN').length;
      const projectCount = this.edges.filter(e => e.to === sk.id && e.type === 'REQUIRES_SKILL').length;
      return { ...sk, studentCount, learnersCount, projectCount };
    });
  }

  createSkill(data) {
    const id = data.id || `sk_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const skill = {
      id,
      name: data.name,
      category: data.category || 'General',
      description: data.description || ''
    };
    this.skills.set(id, skill);
    return skill;
  }

  updateSkill(id, data) {
    if (!this.skills.has(id)) return null;
    const existing = this.skills.get(id);
    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      category: data.category !== undefined ? data.category : existing.category,
      description: data.description !== undefined ? data.description : existing.description
    };
    this.skills.set(id, updated);
    return updated;
  }

  deleteSkill(id) {
    if (!this.skills.has(id)) return false;
    this.skills.delete(id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    return true;
  }

  // --- PROJECT CRUD ---
  getAllProjects() {
    return Array.from(this.projects.values()).map(p => {
      const requiredSkills = this.edges
        .filter(e => e.from === p.id && e.type === 'REQUIRES_SKILL' && this.skills.has(e.to))
        .map(e => this.skills.get(e.to));

      const contributors = this.edges
        .filter(e => e.to === p.id && e.type === 'WORKED_ON' && this.students.has(e.from))
        .map(e => ({
          student: this.students.get(e.from),
          role: e.props.role || 'Contributor'
        }));

      const tags = this.edges
        .filter(e => e.from === p.id && e.type === 'TAGGED_WITH' && this.interests.has(e.to))
        .map(e => this.interests.get(e.to));

      return { ...p, requiredSkills, contributors, tags };
    });
  }

  createProject(data) {
    const id = data.id || `prj_${Date.now()}`;
    const project = {
      id,
      title: data.title,
      description: data.description || '',
      domain: data.domain || 'Software Engineering',
      status: data.status || 'Active',
      githubUrl: data.githubUrl || ''
    };
    this.projects.set(id, project);

    if (Array.isArray(data.requiredSkillIds)) {
      data.requiredSkillIds.forEach(skId => {
        this.addRelationship(id, skId, 'REQUIRES_SKILL');
      });
    }

    if (Array.isArray(data.interestIds)) {
      data.interestIds.forEach(iId => {
        this.addRelationship(id, iId, 'TAGGED_WITH');
      });
    }

    return project;
  }

  updateProject(id, data) {
    if (!this.projects.has(id)) return null;
    const existing = this.projects.get(id);
    const updated = {
      ...existing,
      title: data.title !== undefined ? data.title : existing.title,
      description: data.description !== undefined ? data.description : existing.description,
      domain: data.domain !== undefined ? data.domain : existing.domain,
      status: data.status !== undefined ? data.status : existing.status,
      githubUrl: data.githubUrl !== undefined ? data.githubUrl : existing.githubUrl
    };
    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id) {
    if (!this.projects.has(id)) return false;
    this.projects.delete(id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    return true;
  }

  // --- INTEREST CRUD ---
  getAllInterests() {
    return Array.from(this.interests.values()).map(i => {
      const studentCount = this.edges.filter(e => e.to === i.id && e.type === 'INTERESTED_IN').length;
      const projectCount = this.edges.filter(e => e.to === i.id && e.type === 'TAGGED_WITH').length;
      return { ...i, studentCount, projectCount };
    });
  }

  createInterest(data) {
    const id = data.id || `int_${Date.now()}`;
    const interest = {
      id,
      name: data.name,
      category: data.category || 'General'
    };
    this.interests.set(id, interest);
    return interest;
  }

  deleteInterest(id) {
    if (!this.interests.has(id)) return false;
    this.interests.delete(id);
    this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    return true;
  }

  // --- RELATIONSHIP OPERATIONS ---
  addRelationship(from, to, type, props = {}) {
    // Avoid duplicate edge
    const existing = this.edges.find(e => {
      if (type === 'CONNECTED_TO') {
        return ((e.from === from && e.to === to) || (e.from === to && e.to === from)) && e.type === type;
      }
      return e.from === from && e.to === to && e.type === type;
    });

    if (existing) {
      existing.props = { ...existing.props, ...props };
      return existing;
    }

    const newEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      from,
      to,
      type,
      props
    };
    this.edges.push(newEdge);
    return newEdge;
  }

  removeRelationship(from, to, type) {
    const prevLen = this.edges.length;
    this.edges = this.edges.filter(e => {
      if (type === 'CONNECTED_TO') {
        return !(((e.from === from && e.to === to) || (e.from === to && e.to === from)) && e.type === type);
      }
      return !(e.from === from && e.to === to && e.type === type);
    });
    return this.edges.length < prevLen;
  }

  // --- RECOMMENDATION ALGORITHMS ---

  /**
   * Recommend Peer Collaborators for studentId
   * Computes multi-factor graph similarity:
   * - Shared academic interests (weight 3.0)
   * - Shared skills (weight 2.0)
   * - Shared projects (weight 3.5)
   * - Mentorship capability: Peer has skills student wants to learn (weight 2.5)
   * - Mutual mentorship: Student has skills peer wants to learn (weight 1.5)
   */
  recommendPeers(studentId) {
    const me = this.enrichStudent(studentId);
    if (!me) return [];

    const mySkillIds = new Set(me.skills.map(s => s.id));
    const myWantsLearnIds = new Set(me.wantsToLearn.map(s => s.id));
    const myInterestIds = new Set(me.interests.map(i => i.id));
    const myProjectIds = new Set(me.projects.map(p => p.id));
    const myConnectionIds = new Set(me.connections.map(c => c.id));

    const recommendations = [];

    this.students.forEach((peer, peerId) => {
      if (peerId === studentId) return;

      const pData = this.enrichStudent(peerId);

      // 1. Shared Interests
      const mutualInterests = pData.interests
        .filter(i => myInterestIds.has(i.id))
        .map(i => i.name);

      // 2. Shared Skills
      const mutualSkills = pData.skills
        .filter(s => mySkillIds.has(s.id))
        .map(s => s.name);

      // 3. Shared Projects
      const mutualProjects = pData.projects
        .filter(p => myProjectIds.has(p.id))
        .map(p => p.title);

      // 4. Can Peer teach Student? (Peer has skills Student wants to learn)
      const canTeachSkills = pData.skills
        .filter(s => myWantsLearnIds.has(s.id))
        .map(s => s.name);

      // 5. Can Student teach Peer? (Student has skills Peer wants to learn)
      const peerWantsLearnIds = new Set(pData.wantsToLearn.map(s => s.id));
      const canLearnSkills = me.skills
        .filter(s => peerWantsLearnIds.has(s.id))
        .map(s => s.name);

      const rawScore = 
        mutualInterests.length * 3.0 +
        mutualSkills.length * 2.0 +
        mutualProjects.length * 3.5 +
        canTeachSkills.length * 2.5 +
        canLearnSkills.length * 1.5;

      if (rawScore > 0) {
        // Compute match percentage (capped at 98% for realism)
        const matchPercent = Math.min(98, Math.round((rawScore / 18.0) * 100));

        recommendations.push({
          peer: {
            id: pData.id,
            name: pData.name,
            major: pData.major,
            year: pData.year,
            bio: pData.bio,
            careerGoal: pData.careerGoal,
            avatarColor: pData.avatarColor
          },
          rawScore,
          matchPercent,
          isConnected: myConnectionIds.has(peerId),
          mutualInterests,
          mutualSkills,
          mutualProjects,
          canTeachSkills,
          canLearnSkills
        });
      }
    });

    return recommendations.sort((a, b) => b.rawScore - a.rawScore).slice(0, 8);
  }

  /**
   * Recommend Skills to learn based on:
   * - Collaborative filtering of skills popular among peers sharing interests
   * - Skills required by projects aligned with student interests
   */
  recommendSkills(studentId) {
    const me = this.enrichStudent(studentId);
    if (!me) return [];

    const mySkillIds = new Set(me.skills.map(s => s.id));
    const myWantsLearnIds = new Set(me.wantsToLearn.map(s => s.id));
    const myInterestIds = new Set(me.interests.map(i => i.id));

    const skillScores = new Map();

    // 1. Check peers with overlapping interests
    this.students.forEach((peer, peerId) => {
      if (peerId === studentId) return;
      const pData = this.enrichStudent(peerId);
      
      const commonInterests = pData.interests.filter(i => myInterestIds.has(i.id));
      if (commonInterests.length === 0) return;

      pData.skills.forEach(sk => {
        if (mySkillIds.has(sk.id)) return; // Already has it

        if (!skillScores.has(sk.id)) {
          skillScores.set(sk.id, {
            skill: this.skills.get(sk.id),
            peerCount: 0,
            peerExamples: [],
            relatedInterests: new Set(),
            projectCount: 0,
            projectExamples: []
          });
        }

        const entry = skillScores.get(sk.id);
        entry.peerCount += 1;
        if (entry.peerExamples.length < 3 && !entry.peerExamples.includes(pData.name)) {
          entry.peerExamples.push(pData.name);
        }
        commonInterests.forEach(i => entry.relatedInterests.add(i.name));
      });
    });

    // 2. Check projects tagged with student's interests
    const allProjects = this.getAllProjects();
    allProjects.forEach(prj => {
      const hasInterestMatch = prj.tags.some(t => myInterestIds.has(t.id));
      if (hasInterestMatch) {
        prj.requiredSkills.forEach(sk => {
          if (mySkillIds.has(sk.id)) return; // Already has it

          if (!skillScores.has(sk.id)) {
            skillScores.set(sk.id, {
              skill: this.skills.get(sk.id),
              peerCount: 0,
              peerExamples: [],
              relatedInterests: new Set(),
              projectCount: 0,
              projectExamples: []
            });
          }

          const entry = skillScores.get(sk.id);
          entry.projectCount += 1;
          if (entry.projectExamples.length < 2 && !entry.projectExamples.includes(prj.title)) {
            entry.projectExamples.push(prj.title);
          }
        });
      }
    });

    const results = [];
    skillScores.forEach((data, skId) => {
      if (!data.skill) return;
      const score = data.peerCount * 3.0 + data.projectCount * 2.0;
      results.push({
        recSkill: data.skill,
        relevanceScore: score,
        peerCount: data.peerCount,
        peerExamples: data.peerExamples,
        relatedInterests: Array.from(data.relatedInterests),
        projectCount: data.projectCount,
        projectExamples: data.projectExamples,
        isAlreadyTargeted: myWantsLearnIds.has(skId)
      });
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 8);
  }

  /**
   * Recommend Projects to explore or join
   * Evaluates skill overlap, learning opportunity, and domain alignment
   */
  recommendProjects(studentId) {
    const me = this.enrichStudent(studentId);
    if (!me) return [];

    const mySkillIds = new Set(me.skills.map(s => s.id));
    const myWantsLearnIds = new Set(me.wantsToLearn.map(s => s.id));
    const myInterestIds = new Set(me.interests.map(i => i.id));
    const myProjectIds = new Set(me.projects.map(p => p.id));

    const allProjects = this.getAllProjects();
    const recommendations = [];

    allProjects.forEach(prj => {
      if (myProjectIds.has(prj.id)) return; // Already worked on it

      const requiredSkills = prj.requiredSkills || [];
      const matchedSkills = requiredSkills.filter(sk => mySkillIds.has(sk.id));
      const missingSkills = requiredSkills.filter(sk => !mySkillIds.has(sk.id));
      const learningMatches = missingSkills.filter(sk => myWantsLearnIds.has(sk.id));

      const matchedInterests = (prj.tags || []).filter(t => myInterestIds.has(t.id));

      const totalRequired = requiredSkills.length;
      const matchedCount = matchedSkills.length;
      const skillFitRatio = totalRequired > 0 ? (matchedCount / totalRequired) : 0.5;

      const matchScore = 
        skillFitRatio * 50.0 +
        learningMatches.length * 15.0 +
        matchedInterests.length * 20.0 +
        (prj.status === 'Seeking Contributors' ? 15.0 : 5.0);

      if (matchScore > 10.0) {
        recommendations.push({
          project: {
            id: prj.id,
            title: prj.title,
            description: prj.description,
            domain: prj.domain,
            status: prj.status,
            githubUrl: prj.githubUrl
          },
          matchScore,
          matchPercent: Math.min(99, Math.round(matchScore)),
          skillFitRatio: Math.round(skillFitRatio * 100),
          totalRequired,
          matchedCount,
          matchedSkillNames: matchedSkills.map(s => s.name),
          missingSkillNames: missingSkills.map(s => s.name),
          learningSkillNames: learningMatches.map(s => s.name),
          matchedInterests: matchedInterests.map(i => i.name),
          contributorsCount: (prj.contributors || []).length
        });
      }
    });

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
  }
}

// Singleton in-memory instance
const inMemoryStore = new InMemoryGraph();

module.exports = inMemoryStore;
