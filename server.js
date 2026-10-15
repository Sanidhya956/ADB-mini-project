require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const neo4jManager = require('./db/neo4j');
const graphStore = require('./db/graphStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
// Serve vis-network standalone library directly
app.use('/libs/vis-network', express.static(path.join(__dirname, 'node_modules/vis-network/standalone/umd')));

// ==========================================
// 1. SYSTEM & CONFIGURATION ENDPOINTS
// ==========================================

// Get system & database status
app.get('/api/status', async (req, res) => {
  try {
    const status = graphStore.getEngineStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configure and test Neo4j Connection
app.post('/api/config/neo4j', async (req, res) => {
  const { uri, user, password, database, syncData } = req.body;
  try {
    const connectResult = await neo4jManager.connectNeo4j({
      uri: uri || 'bolt://localhost:7687',
      user: user || 'neo4j',
      password: password || 'password',
      database: database || 'neo4j'
    });

    if (connectResult.success && syncData) {
      await graphStore.syncDataToNeo4j();
    }

    res.json({
      success: connectResult.success,
      connected: connectResult.success,
      message: connectResult.success
        ? `Successfully connected to Neo4j at ${uri}! ${syncData ? 'Graph data synchronized.' : ''}`
        : `Connection failed: ${connectResult.error}`,
      error: connectResult.error
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed or Reset active database with sample dataset
app.post('/api/seed', async (req, res) => {
  try {
    const result = await graphStore.seedActiveDatabase();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Push current In-Memory data to connected Neo4j instance
app.post('/api/sync-to-neo4j', async (req, res) => {
  try {
    const result = await graphStore.syncDataToNeo4j();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. GRAPH VISUALIZATION ENDPOINT
// ==========================================
app.get('/api/graph', async (req, res) => {
  try {
    const graphData = await graphStore.getFullGraph();
    res.json({ success: true, ...graphData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. STUDENT CRUD ENDPOINTS
// ==========================================
app.get('/api/students', async (req, res) => {
  try {
    const students = await graphStore.getAllStudents();
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await graphStore.getStudentById(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, email, major, year, bio, careerGoal, avatarColor, skillIds, interestIds } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const student = await graphStore.createStudent({
      name, email, major, year, bio, careerGoal, avatarColor, skillIds, interestIds
    });
    res.status(201).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await graphStore.updateStudent(req.params.id, req.body);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const deleted = await graphStore.deleteStudent(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, message: 'Student and related edges removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. SKILLS CRUD ENDPOINTS
// ==========================================
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await graphStore.getAllSkills();
    res.json({ success: true, skills });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/skills', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Skill name is required' });

    const skill = await graphStore.createSkill({ name, category, description });
    res.status(201).json({ success: true, skill });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/skills/:id', async (req, res) => {
  try {
    const skill = await graphStore.updateSkill(req.params.id, req.body);
    if (!skill) return res.status(404).json({ success: false, error: 'Skill not found' });
    res.json({ success: true, skill });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  try {
    const deleted = await graphStore.deleteSkill(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Skill not found' });
    res.json({ success: true, message: 'Skill removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. PROJECTS CRUD ENDPOINTS
// ==========================================
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await graphStore.getAllProjects();
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, domain, status, githubUrl, requiredSkillIds, interestIds } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Project title is required' });

    const project = await graphStore.createProject({
      title, description, domain, status, githubUrl, requiredSkillIds, interestIds
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await graphStore.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const deleted = await graphStore.deleteProject(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, message: 'Project removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. INTERESTS CRUD ENDPOINTS
// ==========================================
app.get('/api/interests', async (req, res) => {
  try {
    const interests = await graphStore.getAllInterests();
    res.json({ success: true, interests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/interests', async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Interest name is required' });

    const interest = await graphStore.createInterest({ name, category });
    res.status(201).json({ success: true, interest });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/interests/:id', async (req, res) => {
  try {
    const deleted = await graphStore.deleteInterest(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Interest not found' });
    res.json({ success: true, message: 'Interest removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. RELATIONSHIPS ENDPOINTS (LINK/UNLINK)
// ==========================================
app.post('/api/relationships', async (req, res) => {
  try {
    const { from, to, type, props } = req.body;
    if (!from || !to || !type) {
      return res.status(400).json({ success: false, error: 'from, to, and type are required' });
    }

    const rel = await graphStore.addRelationship(from, to, type, props || {});
    res.status(201).json({ success: true, relationship: rel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/relationships', async (req, res) => {
  try {
    const { from, to, type } = req.body;
    if (!from || !to || !type) {
      return res.status(400).json({ success: false, error: 'from, to, and type are required' });
    }

    const removed = await graphStore.removeRelationship(from, to, type);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. RECOMMENDATION ENGINE ENDPOINT
// ==========================================
app.get('/api/recommendations/:studentId', async (req, res) => {
  try {
    const recs = await graphStore.getRecommendations(req.params.studentId);
    res.json({ success: true, ...recs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. CYPHER QUERY PLAYGROUND ENDPOINT
// ==========================================
app.post('/api/cypher', async (req, res) => {
  try {
    const { query, params } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query string is required' });

    const result = await graphStore.executeCypher(query, params || {});
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Fallback to SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server and attempt initial Neo4j connection
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(` Student Networking & Skill Recommendation System`);
  console.log(` Server running at: http://localhost:${PORT}`);
  console.log(`=======================================================`);

  // Try connecting to Neo4j if configured or local
  const connectRes = await neo4jManager.connectNeo4j();
  if (connectRes.success) {
    console.log(`[Status] Connected to live Neo4j database!`);
  } else {
    console.log(`[Status] Running in In-Memory Graph mode (No live Neo4j required)`);
    console.log(`[Note] You can connect to Neo4j Desktop or Aura anytime in the UI!`);
  }
});
