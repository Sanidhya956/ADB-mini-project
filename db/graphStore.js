// Unified Graph Storage Layer (Switches between Live Neo4j & In-Memory Store)
const neo4jManager = require('./neo4j');
const inMemoryStore = require('./inMemoryStore');
const CYPHER_QUERIES = require('./cypherQueries');
const SEED_DATA = require('./seedData');

class GraphStore {
  constructor() {
    this.mode = 'in-memory'; // or 'neo4j'
  }

  isNeo4jActive() {
    return neo4jManager.getStatus().isConnected;
  }

  getMode() {
    return this.isNeo4jActive() ? 'neo4j' : 'in-memory';
  }

  getEngineStatus() {
    const neoStatus = neo4jManager.getStatus();
    const stats = this.isNeo4jActive()
      ? null // will be populated via query if needed
      : inMemoryStore.getStats();

    return {
      activeEngine: this.getMode(),
      neo4j: neoStatus,
      stats: stats || inMemoryStore.getStats()
    };
  }

  // Seed sample data into active DB
  async seedActiveDatabase() {
    if (this.isNeo4jActive()) {
      return await this.syncDataToNeo4j(SEED_DATA);
    } else {
      inMemoryStore.reset();
      return { success: true, message: 'In-Memory Graph database re-seeded successfully.' };
    }
  }

  // Migrate/Push data into Neo4j
  async syncDataToNeo4j(data = null) {
    if (!this.isNeo4jActive()) {
      throw new Error('Neo4j is not connected. Please connect first.');
    }

    const payload = data || {
      students: inMemoryStore.getAllStudents(),
      skills: inMemoryStore.getAllSkills(),
      projects: inMemoryStore.getAllProjects(),
      interests: inMemoryStore.getAllInterests(),
      relationships: inMemoryStore.edges
    };

    // Initialize constraints
    for (const q of CYPHER_QUERIES.initSchema) {
      try {
        await neo4jManager.runCypher(q);
      } catch (err) {
        console.warn('[Schema Init]', err.message);
      }
    }

    // Clear existing graph in Neo4j
    await neo4jManager.runCypher('MATCH (n) DETACH DELETE n');

    // Create Students
    for (const s of payload.students) {
      await neo4jManager.runCypher(CYPHER_QUERIES.createStudent, {
        id: s.id,
        name: s.name,
        email: s.email || '',
        major: s.major || '',
        year: s.year || '',
        bio: s.bio || '',
        careerGoal: s.careerGoal || '',
        avatarColor: s.avatarColor || '#6366f1'
      });
    }

    // Create Skills
    for (const sk of payload.skills) {
      await neo4jManager.runCypher(CYPHER_QUERIES.createSkill, {
        id: sk.id,
        name: sk.name,
        category: sk.category || '',
        description: sk.description || ''
      });
    }

    // Create Projects
    for (const p of payload.projects) {
      await neo4jManager.runCypher(CYPHER_QUERIES.createProject, {
        id: p.id,
        title: p.title,
        description: p.description || '',
        domain: p.domain || '',
        status: p.status || 'Active',
        githubUrl: p.githubUrl || ''
      });
    }

    // Create Interests
    for (const i of payload.interests) {
      await neo4jManager.runCypher(CYPHER_QUERIES.createInterest, {
        id: i.id,
        name: i.name,
        category: i.category || ''
      });
    }

    // Create Relationships
    const rels = payload.relationships || [];
    for (const r of rels) {
      try {
        switch (r.type) {
          case 'HAS_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentSkill, {
              studentId: r.from,
              skillId: r.to,
              proficiency: (r.props && r.props.proficiency) || 'Intermediate'
            });
            break;
          case 'WANTS_TO_LEARN':
            await neo4jManager.runCypher(CYPHER_QUERIES.addWantToLearn, {
              studentId: r.from,
              skillId: r.to
            });
            break;
          case 'INTERESTED_IN':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentInterest, {
              studentId: r.from,
              interestId: r.to
            });
            break;
          case 'WORKED_ON':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentProject, {
              studentId: r.from,
              projectId: r.to,
              role: (r.props && r.props.role) || 'Contributor'
            });
            break;
          case 'REQUIRES_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.addProjectRequiredSkill, {
              projectId: r.from,
              skillId: r.to
            });
            break;
          case 'TAGGED_WITH':
            await neo4jManager.runCypher(`
              MATCH (p:Project {id: $from}), (i:Interest {id: $to})
              MERGE (p)-[:TAGGED_WITH]->(i)
            `, { from: r.from, to: r.to });
            break;
          case 'CONNECTED_TO':
            await neo4jManager.runCypher(CYPHER_QUERIES.connectStudents, {
              studentId1: r.from,
              studentId2: r.to
            });
            break;
        }
      } catch (e) {
        console.warn(`[Neo4j Rel Error: ${r.type}]`, e.message);
      }
    }

    return { success: true, message: 'All nodes and relationships successfully synced to Neo4j!' };
  }

  // --- FULL GRAPH VISUALIZER PAYLOAD ---
  async getFullGraph() {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getFullGraph);
        if (records.length > 0) {
          const rawNodes = records[0].nodes || [];
          const rawRels = records[0].relationships || [];

          const nodes = rawNodes.map(n => {
            const labels = n._labels || [];
            const group = labels.includes('Student') ? 'Student' :
                          labels.includes('Skill') ? 'Skill' :
                          labels.includes('Project') ? 'Project' : 'Interest';
            return {
              id: n.id,
              label: n.name || n.title,
              group,
              sublabel: n.major || n.category || n.domain || '',
              color: group === 'Student' ? (n.avatarColor || '#6366f1') :
                     group === 'Skill' ? '#10b981' :
                     group === 'Project' ? '#8b5cf6' : '#f59e0b'
            };
          });

          // To reconstruct edges, fetch with source/target IDs
          const edgeRes = await neo4jManager.runCypher(`
            MATCH (a)-[r]->(b)
            RETURN a.id AS from, b.id AS to, type(r) AS type, properties(r) AS props, id(r) AS edgeId
          `);

          const edges = edgeRes.records.map(r => ({
            id: `edge_${r.edgeId}`,
            from: r.from,
            to: r.to,
            label: r.type,
            type: r.type,
            props: r.props || {}
          }));

          return { nodes, edges };
        }
      } catch (err) {
        console.warn('[Neo4j getFullGraph fallback]', err.message);
      }
    }
    return inMemoryStore.getFullGraph();
  }

  // --- STUDENTS ---
  async getAllStudents() {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getAllStudents);
        return records.map(r => ({
          ...r.s,
          skills: r.skills || [],
          wantsToLearn: r.wantsToLearn || [],
          projects: r.projects || [],
          interests: r.interests || [],
          connections: r.connections || []
        }));
      } catch (e) {
        console.warn('[Neo4j getAllStudents fallback]', e.message);
      }
    }
    return inMemoryStore.getAllStudents();
  }

  async getStudentById(id) {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getStudentById, { id });
        if (records.length > 0) {
          const r = records[0];
          return {
            ...r.s,
            skills: r.skills || [],
            wantsToLearn: r.wantsToLearn || [],
            projects: r.projects || [],
            interests: r.interests || [],
            connections: r.connections || []
          };
        }
        return null;
      } catch (e) {
        console.warn('[Neo4j getStudentById fallback]', e.message);
      }
    }
    return inMemoryStore.getStudentById(id);
  }

  async createStudent(data) {
    // Keep in-memory store synchronized as fallback
    const memCreated = inMemoryStore.createStudent(data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.createStudent, {
          id: memCreated.id,
          name: memCreated.name,
          email: memCreated.email,
          major: memCreated.major,
          year: memCreated.year,
          bio: memCreated.bio,
          careerGoal: memCreated.careerGoal,
          avatarColor: memCreated.avatarColor
        });

        if (Array.isArray(data.skillIds)) {
          for (const skId of data.skillIds) {
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentSkill, {
              studentId: memCreated.id,
              skillId: skId,
              proficiency: 'Intermediate'
            });
          }
        }
        if (Array.isArray(data.interestIds)) {
          for (const iId of data.interestIds) {
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentInterest, {
              studentId: memCreated.id,
              interestId: iId
            });
          }
        }
        return await this.getStudentById(memCreated.id);
      } catch (e) {
        console.warn('[Neo4j createStudent fallback]', e.message);
      }
    }
    return memCreated;
  }

  async updateStudent(id, data) {
    const memUpdated = inMemoryStore.updateStudent(id, data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.updateStudent, {
          id,
          name: data.name || memUpdated.name,
          email: data.email || memUpdated.email,
          major: data.major || memUpdated.major,
          year: data.year || memUpdated.year,
          bio: data.bio || memUpdated.bio,
          careerGoal: data.careerGoal || memUpdated.careerGoal,
          avatarColor: data.avatarColor || memUpdated.avatarColor
        });
      } catch (e) {
        console.warn('[Neo4j updateStudent fallback]', e.message);
      }
    }
    return memUpdated;
  }

  async deleteStudent(id) {
    const memDeleted = inMemoryStore.deleteStudent(id);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.deleteStudent, { id });
      } catch (e) {
        console.warn('[Neo4j deleteStudent fallback]', e.message);
      }
    }
    return memDeleted;
  }

  // --- SKILLS ---
  async getAllSkills() {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getAllSkills);
        return records.map(r => ({
          ...r.sk,
          studentCount: r.studentCount,
          learnersCount: r.learnersCount,
          projectCount: r.projectCount
        }));
      } catch (e) {
        console.warn('[Neo4j getAllSkills fallback]', e.message);
      }
    }
    return inMemoryStore.getAllSkills();
  }

  async createSkill(data) {
    const memCreated = inMemoryStore.createSkill(data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.createSkill, {
          id: memCreated.id,
          name: memCreated.name,
          category: memCreated.category,
          description: memCreated.description
        });
      } catch (e) {
        console.warn('[Neo4j createSkill fallback]', e.message);
      }
    }
    return memCreated;
  }

  async updateSkill(id, data) {
    const memUpdated = inMemoryStore.updateSkill(id, data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.updateSkill, {
          id,
          name: data.name,
          category: data.category,
          description: data.description
        });
      } catch (e) {
        console.warn('[Neo4j updateSkill fallback]', e.message);
      }
    }
    return memUpdated;
  }

  async deleteSkill(id) {
    const memDeleted = inMemoryStore.deleteSkill(id);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.deleteSkill, { id });
      } catch (e) {
        console.warn('[Neo4j deleteSkill fallback]', e.message);
      }
    }
    return memDeleted;
  }

  // --- PROJECTS ---
  async getAllProjects() {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getAllProjects);
        return records.map(r => ({
          ...r.p,
          requiredSkills: r.requiredSkills || [],
          contributors: r.contributors || [],
          tags: r.tags || []
        }));
      } catch (e) {
        console.warn('[Neo4j getAllProjects fallback]', e.message);
      }
    }
    return inMemoryStore.getAllProjects();
  }

  async createProject(data) {
    const memCreated = inMemoryStore.createProject(data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.createProject, {
          id: memCreated.id,
          title: memCreated.title,
          description: memCreated.description,
          domain: memCreated.domain,
          status: memCreated.status,
          githubUrl: memCreated.githubUrl
        });

        if (Array.isArray(data.requiredSkillIds)) {
          for (const skId of data.requiredSkillIds) {
            await neo4jManager.runCypher(CYPHER_QUERIES.addProjectRequiredSkill, {
              projectId: memCreated.id,
              skillId: skId
            });
          }
        }
      } catch (e) {
        console.warn('[Neo4j createProject fallback]', e.message);
      }
    }
    return memCreated;
  }

  async updateProject(id, data) {
    const memUpdated = inMemoryStore.updateProject(id, data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.updateProject, {
          id,
          title: data.title,
          description: data.description,
          domain: data.domain,
          status: data.status,
          githubUrl: data.githubUrl
        });
      } catch (e) {
        console.warn('[Neo4j updateProject fallback]', e.message);
      }
    }
    return memUpdated;
  }

  async deleteProject(id) {
    const memDeleted = inMemoryStore.deleteProject(id);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.deleteProject, { id });
      } catch (e) {
        console.warn('[Neo4j deleteProject fallback]', e.message);
      }
    }
    return memDeleted;
  }

  // --- INTERESTS ---
  async getAllInterests() {
    if (this.isNeo4jActive()) {
      try {
        const { records } = await neo4jManager.runCypher(CYPHER_QUERIES.getAllInterests);
        return records.map(r => ({
          ...r.i,
          studentCount: r.studentCount,
          projectCount: r.projectCount
        }));
      } catch (e) {
        console.warn('[Neo4j getAllInterests fallback]', e.message);
      }
    }
    return inMemoryStore.getAllInterests();
  }

  async createInterest(data) {
    const memCreated = inMemoryStore.createInterest(data);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.createInterest, {
          id: memCreated.id,
          name: memCreated.name,
          category: memCreated.category
        });
      } catch (e) {
        console.warn('[Neo4j createInterest fallback]', e.message);
      }
    }
    return memCreated;
  }

  async deleteInterest(id) {
    const memDeleted = inMemoryStore.deleteInterest(id);
    if (this.isNeo4jActive()) {
      try {
        await neo4jManager.runCypher(CYPHER_QUERIES.deleteInterest, { id });
      } catch (e) {
        console.warn('[Neo4j deleteInterest fallback]', e.message);
      }
    }
    return memDeleted;
  }

  // --- RELATIONSHIPS ---
  async addRelationship(from, to, type, props = {}) {
    const memEdge = inMemoryStore.addRelationship(from, to, type, props);
    if (this.isNeo4jActive()) {
      try {
        switch (type) {
          case 'HAS_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentSkill, {
              studentId: from,
              skillId: to,
              proficiency: props.proficiency || 'Intermediate'
            });
            break;
          case 'WANTS_TO_LEARN':
            await neo4jManager.runCypher(CYPHER_QUERIES.addWantToLearn, {
              studentId: from,
              skillId: to
            });
            break;
          case 'INTERESTED_IN':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentInterest, {
              studentId: from,
              interestId: to
            });
            break;
          case 'WORKED_ON':
            await neo4jManager.runCypher(CYPHER_QUERIES.addStudentProject, {
              studentId: from,
              projectId: to,
              role: props.role || 'Contributor'
            });
            break;
          case 'REQUIRES_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.addProjectRequiredSkill, {
              projectId: from,
              skillId: to
            });
            break;
          case 'CONNECTED_TO':
            await neo4jManager.runCypher(CYPHER_QUERIES.connectStudents, {
              studentId1: from,
              studentId2: to
            });
            break;
        }
      } catch (e) {
        console.warn('[Neo4j addRelationship fallback]', e.message);
      }
    }
    return memEdge;
  }

  async removeRelationship(from, to, type) {
    const memRemoved = inMemoryStore.removeRelationship(from, to, type);
    if (this.isNeo4jActive()) {
      try {
        switch (type) {
          case 'HAS_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.removeStudentSkill, { studentId: from, skillId: to });
            break;
          case 'WANTS_TO_LEARN':
            await neo4jManager.runCypher(CYPHER_QUERIES.removeWantToLearn, { studentId: from, skillId: to });
            break;
          case 'INTERESTED_IN':
            await neo4jManager.runCypher(CYPHER_QUERIES.removeStudentInterest, { studentId: from, interestId: to });
            break;
          case 'WORKED_ON':
            await neo4jManager.runCypher(CYPHER_QUERIES.removeStudentProject, { studentId: from, projectId: to });
            break;
          case 'REQUIRES_SKILL':
            await neo4jManager.runCypher(CYPHER_QUERIES.removeProjectRequiredSkill, { projectId: from, skillId: to });
            break;
          case 'CONNECTED_TO':
            await neo4jManager.runCypher(CYPHER_QUERIES.disconnectStudents, { studentId1: from, studentId2: to });
            break;
        }
      } catch (e) {
        console.warn('[Neo4j removeRelationship fallback]', e.message);
      }
    }
    return memRemoved;
  }

  // --- RECOMMENDATIONS ---
  async getRecommendations(studentId) {
    if (this.isNeo4jActive()) {
      try {
        // Run Cypher recommendation queries in parallel
        const [peersRes, skillsRes, projectsRes] = await Promise.all([
          neo4jManager.runCypher(CYPHER_QUERIES.recommendPeers, { studentId }),
          neo4jManager.runCypher(CYPHER_QUERIES.recommendSkills, { studentId }),
          neo4jManager.runCypher(CYPHER_QUERIES.recommendProjects, { studentId })
        ]);

        const peers = peersRes.records.map(r => ({
          peer: r.peer,
          rawScore: r.rawScore,
          matchPercent: Math.min(99, Math.round((r.rawScore / 18.0) * 100)),
          isConnected: r.isConnected,
          mutualInterests: r.mutualInterests || [],
          mutualSkills: r.mutualSkills || [],
          mutualProjects: r.mutualProjects || [],
          canTeachSkills: r.canTeachSkills || [],
          canLearnSkills: r.canLearnSkills || []
        }));

        const skills = skillsRes.records.map(r => ({
          recSkill: r.recSkill,
          relevanceScore: r.relevanceScore,
          peerCount: r.peerCount,
          peerExamples: r.peerExamples || [],
          relatedInterests: r.relatedInterests || [],
          projectCount: r.projectCount,
          projectExamples: r.projectExamples || [],
          isAlreadyTargeted: r.isAlreadyTargeted
        }));

        const projects = projectsRes.records.map(r => ({
          project: r.p,
          matchScore: r.matchScore,
          matchPercent: Math.min(99, Math.round(r.matchScore)),
          skillFitRatio: Math.round((r.skillFitRatio || 0) * 100),
          totalRequired: r.totalRequired,
          matchedCount: r.matchedCount,
          matchedSkillNames: r.matchedSkillNames || [],
          missingSkillNames: r.missingSkillNames || [],
          learningSkillNames: r.learningSkillNames || [],
          matchedInterests: r.matchedInterests || [],
          contributorsCount: 0
        }));

        return { peers, skills, projects, source: 'neo4j' };
      } catch (err) {
        console.warn('[Neo4j Recommendations fallback]', err.message);
      }
    }

    // In-Memory Engine Fallback
    const peers = inMemoryStore.recommendPeers(studentId);
    const skills = inMemoryStore.recommendSkills(studentId);
    const projects = inMemoryStore.recommendProjects(studentId);

    return { peers, skills, projects, source: 'in-memory' };
  }

  // --- RAW CYPHER CONSOLE ---
  async executeCypher(query, params = {}) {
    if (this.isNeo4jActive()) {
      return await neo4jManager.runCypher(query, params);
    } else {
      // In-memory query simulation notice
      return {
        records: [],
        summary: {
          query,
          simulated: true,
          message: 'Neo4j server is not currently connected. Connect to Neo4j in Settings to run live Cypher queries against Neo4j engine.'
        }
      };
    }
  }
}

module.exports = new GraphStore();
