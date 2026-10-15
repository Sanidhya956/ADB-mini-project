# Student Networking & Skill Recommendation System Using Graph Database

A full-stack Graph Database application designed to connect university students based on shared technical skills, academic interests, project collaborations, and career goals.

Built with **Neo4j**, **Cypher**, **Node.js/Express**, and an interactive **Vis.js Graph Visualizer**.

---

## 🌟 Key Features

1. **Dual-Mode Graph Engine (Instant Run + Live Neo4j)**:
   - **Live Neo4j Mode**: Connects directly to **Neo4j Desktop**, **Docker**, or **Neo4j AuraDB** cloud instance via official `neo4j-driver` using native Cypher queries.
   - **Built-in In-Memory Graph Engine**: Runs immediately out of the box with zero setup required, implementing graph traversal, Jaccard similarity, and collaborative filtering algorithms.
   - **One-Click Sync**: Migrate and synchronize in-memory graph data to Neo4j with a single click.

2. **Graph Recommendation Engine**:
   - 🤝 **Peer Collaborator Matching**: Identifies students with high multi-factor graph similarity (shared interests, complementary skills, shared projects) and mentorship potential (peers holding skills you want to learn).
   - 💡 **Skill Gap & Discovery**: Uses graph collaborative filtering to recommend skills mastered by peers who share your academic interests, or required by projects in your domain.
   - 🚀 **Project Recommendations**: Calculates skill-fit percentage between a student's profile and open projects, highlighting both skills brought to the table and learning opportunities.

3. **Complete CRUD Management**:
   - **Students**: Create, update, view, and delete student profiles with majors, academic year, bio, and career goals.
   - **Skills**: Catalog skills with categories, student counts, and demand metrics.
   - **Projects**: Manage projects with domains, status (`Active`, `Seeking Contributors`), and required skill sets.
   - **Interests**: Academic research and domain interests.
   - **Relationships**: Graph link builder to connect students with skills (`HAS_SKILL`, `WANTS_TO_LEARN`), interests (`INTERESTED_IN`), projects (`WORKED_ON`), and peers (`CONNECTED_TO`).

4. **Interactive Graph Visualizer**:
   - Physics-driven graph canvas with color-coded nodes (Students: Indigo, Skills: Emerald Green, Projects: Purple, Interests: Amber).
   - Real-time type filters, node search with auto-focus, physics freeze/unfreeze, and slide-in node detail drawer.

5. **Cypher Query Console**:
   - Built-in Cypher console to run raw queries against Neo4j or test preset queries (e.g., student-skill maps, peer similarity, top sought-after skills, isolated nodes).

---

## 📊 Graph Data Model

### Node Labels
- `(:Student { id, name, email, major, year, bio, careerGoal, avatarColor })`
- `(:Skill { id, name, category, description })`
- `(:Project { id, title, description, domain, status, githubUrl })`
- `(:Interest { id, name, category })`

### Relationship Types
- `(:Student)-[:HAS_SKILL { proficiency: 'Beginner'|'Intermediate'|'Advanced' }]->(:Skill)`
- `(:Student)-[:WANTS_TO_LEARN]->(:Skill)`
- `(:Student)-[:INTERESTED_IN]->(:Interest)`
- `(:Student)-[:WORKED_ON { role: 'Lead Developer'|'Contributor' }]->(:Project)`
- `(:Project)-[:REQUIRES_SKILL]->(:Skill)`
- `(:Project)-[:TAGGED_WITH]->(:Interest)`
- `(:Student)-[:CONNECTED_TO { since: date }]->(:Student)`

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- Optional: [Neo4j Desktop](https://neo4j.com/download/) or Neo4j Docker container (or a free [Neo4j AuraDB](https://neo4j.com/cloud/aura/) instance)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The application will launch at: **`http://localhost:3000`**

### 3. Connect to Neo4j (Optional)
If you have Neo4j running locally:
1. Open the web app at `http://localhost:3000`.
2. Click **Neo4j Config** in the top navigation bar.
3. Enter your connection URI (default: `bolt://localhost:7687`), username (`neo4j`), and password.
4. Check **"Automatically synchronize current graph data to Neo4j"** and click **Connect & Test**.

---

## 🧠 Recommendation Cypher Queries

### 1. Peer Collaborator Recommendation
```cypher
MATCH (s:Student {id: $studentId})
MATCH (peer:Student) WHERE peer.id <> s.id

OPTIONAL MATCH (s)-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(peer)
WITH s, peer, count(DISTINCT i) AS sharedInterests, collect(DISTINCT i.name) AS mutualInterests

OPTIONAL MATCH (s)-[:HAS_SKILL]->(sk:Skill)<-[:HAS_SKILL]-(peer)
WITH s, peer, sharedInterests, mutualInterests, count(DISTINCT sk) AS sharedSkills, collect(DISTINCT sk.name) AS mutualSkills

OPTIONAL MATCH (s)-[:WORKED_ON]->(p:Project)<-[:WORKED_ON]-(peer)
WITH s, peer, sharedInterests, mutualInterests, sharedSkills, mutualSkills,
     count(DISTINCT p) AS sharedProjects, collect(DISTINCT p.title) AS mutualProjects

OPTIONAL MATCH (s)-[:WANTS_TO_LEARN]->(wsk:Skill)<-[:HAS_SKILL]-(peer)
WITH s, peer, sharedInterests, mutualInterests, sharedSkills, mutualSkills, sharedProjects, mutualProjects,
     count(DISTINCT wsk) AS canTeachCount, collect(DISTINCT wsk.name) AS canTeachSkills

WITH peer, (sharedInterests * 3.0 + sharedSkills * 2.0 + sharedProjects * 3.5 + canTeachCount * 2.5) AS rawScore,
     mutualInterests, mutualSkills, mutualProjects, canTeachSkills
WHERE rawScore > 0
RETURN peer, rawScore, mutualInterests, mutualSkills, mutualProjects, canTeachSkills
ORDER BY rawScore DESC
LIMIT 8;
```

### 2. Skill Recommendation (Collaborative Filtering)
```cypher
MATCH (s:Student {id: $studentId})-[:INTERESTED_IN]->(i:Interest)<-[:INTERESTED_IN]-(peer:Student)-[:HAS_SKILL]->(recSkill:Skill)
WHERE NOT (s)-[:HAS_SKILL]->(recSkill)
WITH s, recSkill, count(DISTINCT peer) AS peerCount, collect(DISTINCT peer.name)[0..3] AS peerExamples, collect(DISTINCT i.name) AS relatedInterests

OPTIONAL MATCH (p:Project)-[:REQUIRES_SKILL]->(recSkill)
OPTIONAL MATCH (p)-[:TAGGED_WITH]->(pi:Interest)<-[:INTERESTED_IN]-(s)
WITH s, recSkill, peerCount, peerExamples, relatedInterests, count(DISTINCT p) AS projectCount

WITH recSkill, (peerCount * 3.0 + projectCount * 2.0) AS relevanceScore, peerCount, peerExamples, relatedInterests
RETURN recSkill, relevanceScore, peerCount, peerExamples, relatedInterests
ORDER BY relevanceScore DESC
LIMIT 8;
```

---

## 🛠 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | `GET` | Get engine mode (Neo4j / In-Memory), stats & connection state |
| `/api/config/neo4j` | `POST` | Configure and test live Neo4j credentials |
| `/api/seed` | `POST` | Reset / re-seed active database with sample university dataset |
| `/api/graph` | `GET` | Get nodes and edges formatted for graph visualizer |
| `/api/students` | `GET`, `POST` | List all students or create a new student |
| `/api/students/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete a student |
| `/api/skills` | `GET`, `POST` | List all skills or create a new skill |
| `/api/skills/:id` | `PUT`, `DELETE` | Update or delete a skill |
| `/api/projects` | `GET`, `POST` | List all projects or create a new project |
| `/api/projects/:id` | `PUT`, `DELETE` | Update or delete a project |
| `/api/interests` | `GET`, `POST` | List all academic interests or create a new interest |
| `/api/interests/:id` | `DELETE` | Delete an academic interest |
| `/api/relationships` | `POST`, `DELETE` | Create or remove relationship edges |
| `/api/recommendations/:studentId` | `GET` | Generate peer, skill, and project recommendations |
| `/api/cypher` | `POST` | Execute raw Cypher queries |
