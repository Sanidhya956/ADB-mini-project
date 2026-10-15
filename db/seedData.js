// Rich seed data for Student Networking & Skill Recommendation System

const SEED_DATA = {
  students: [
    {
      id: "std_maya",
      name: "Maya Chen",
      email: "maya.chen@university.edu",
      major: "Artificial Intelligence",
      year: "Senior",
      bio: "Passionate about NLP, Knowledge Graphs, and Autonomous Agents. Building graph-guided LLM systems.",
      careerGoal: "AI Research Scientist",
      avatarColor: "#6366f1"
    },
    {
      id: "std_alex",
      name: "Alex Rivera",
      email: "alex.r@university.edu",
      major: "Computer Science",
      year: "Junior",
      bio: "Full-stack developer enthusiastic about reactive architectures, Node.js microservices, and graph UI design.",
      careerGoal: "Full-Stack Software Architect",
      avatarColor: "#0ea5e9"
    },
    {
      id: "std_priya",
      name: "Priya Sharma",
      email: "priya.s@university.edu",
      major: "Data Science",
      year: "Graduate",
      bio: "Graph database enthusiast with strong background in Neo4j, Cypher, and distributed data pipelines.",
      careerGoal: "Graph Data Engineer",
      avatarColor: "#10b981"
    },
    {
      id: "std_liam",
      name: "Liam Smith",
      email: "liam.smith@university.edu",
      major: "Cybersecurity",
      year: "Senior",
      bio: "Security researcher focusing on zero-trust networks, graph-based threat intelligence, and cryptography.",
      careerGoal: "Cyber Threat Intelligence Lead",
      avatarColor: "#ef4444"
    },
    {
      id: "std_zoe",
      name: "Zoe Davis",
      email: "zoe.davis@university.edu",
      major: "Human-Computer Interaction",
      year: "Junior",
      bio: "Product designer and frontend engineer obsessed with intuitive graph visualizers and accessible data UX.",
      careerGoal: "Product Design Technologist",
      avatarColor: "#ec4899"
    },
    {
      id: "std_omar",
      name: "Omar Farooq",
      email: "omar.f@university.edu",
      major: "Cloud Systems & DevOps",
      year: "Sophomore",
      bio: "Kubernetes and Docker enthusiast exploring Infrastructure-as-Code and high-availability database clustering.",
      careerGoal: "Cloud Solutions Architect",
      avatarColor: "#f59e0b"
    },
    {
      id: "std_elena",
      name: "Elena Rostova",
      email: "elena.r@university.edu",
      major: "Data Science",
      year: "Senior",
      bio: "Applied ML practitioner working on recommendation algorithms, collaborative filtering, and PyTorch models.",
      careerGoal: "Recommendation Systems Engineer",
      avatarColor: "#8b5cf6"
    },
    {
      id: "std_marcus",
      name: "Marcus Vance",
      email: "marcus.v@university.edu",
      major: "Computer Science",
      year: "Sophomore",
      bio: "Curious student learning algorithms, Python, and open-source contributions. Excited to join hackathons.",
      careerGoal: "Backend Software Engineer",
      avatarColor: "#14b8a6"
    }
  ],

  skills: [
    { id: "sk_python", name: "Python", category: "Programming Language", description: "General-purpose language for AI, data analysis, and backend scripting." },
    { id: "sk_neo4j", name: "Neo4j & Cypher", category: "Database", description: "Native graph database and declarative Cypher query language." },
    { id: "sk_react", name: "React.js", category: "Frontend", description: "Component-driven declarative frontend library for modern web apps." },
    { id: "sk_node", name: "Node.js & Express", category: "Backend", description: "JavaScript runtime for building scalable networked REST & GraphQL APIs." },
    { id: "sk_pytorch", name: "PyTorch", category: "Machine Learning", description: "Deep learning framework for computer vision and NLP models." },
    { id: "sk_docker", name: "Docker & Containers", category: "DevOps & Cloud", description: "Containerization platform for reliable development and deployment." },
    { id: "sk_typescript", name: "TypeScript", category: "Programming Language", description: "Typed superset of JavaScript enhancing code safety and scale." },
    { id: "sk_k8s", name: "Kubernetes", category: "DevOps & Cloud", description: "Container orchestration system for automating containerized workloads." },
    { id: "sk_sql", name: "PostgreSQL / SQL", category: "Database", description: "Relational database querying, indexing, and transactional data integrity." },
    { id: "sk_threat_analysis", name: "Threat Modeling", category: "Cybersecurity", description: "Systematic identification of security vulnerabilities and attack surfaces." },
    { id: "sk_uiux", name: "UI/UX & Figma", category: "Design", description: "User journey mapping, wireframing, typography, and interactive prototyping." },
    { id: "sk_nlp", name: "Natural Language Processing", category: "Machine Learning", description: "Tokenization, transformers, LLM prompt engineering, and semantic search." },
    { id: "sk_graphql", name: "GraphQL", category: "Backend", description: "Query language for client-driven flexible API endpoints." },
    { id: "sk_aws", name: "AWS Cloud", category: "DevOps & Cloud", description: "Amazon Web Services including Lambda, S3, ECS, and DynamoDB." }
  ],

  interests: [
    { id: "int_ai", name: "Artificial Intelligence", category: "Academic Research" },
    { id: "int_graph_db", name: "Graph Databases & Analytics", category: "Database Systems" },
    { id: "int_web_dev", name: "Modern Web Architecture", category: "Software Engineering" },
    { id: "int_cybersecurity", name: "Network & Cloud Security", category: "Security" },
    { id: "int_hci", name: "Human-Computer Interaction", category: "Design & UX" },
    { id: "int_cloud_systems", name: "Cloud & Distributed Systems", category: "Infrastructure" },
    { id: "int_data_science", name: "Data Science & Predictive Modeling", category: "Data Analytics" }
  ],

  projects: [
    {
      id: "prj_graph_net",
      title: "Student Graph Network",
      description: "Interactive graph platform mapping university students, skills, and academic interests with peer recommendations.",
      domain: "Graph Databases & AI",
      status: "Active",
      githubUrl: "https://github.com/uni/student-graph-network"
    },
    {
      id: "prj_health_bot",
      title: "AI Clinical Assist Chatbot",
      description: "Context-aware conversational medical triage assistant powered by PyTorch, BioBERT, and medical knowledge graphs.",
      domain: "Healthcare AI",
      status: "Seeking Contributors",
      githubUrl: "https://github.com/uni/ai-health-bot"
    },
    {
      id: "prj_canvas_sync",
      title: "Realtime Collaborative Whiteboard",
      description: "High-performance collaborative canvas with WebSockets, CRDTs, and interactive visual graph mapping.",
      domain: "Modern Web Architecture",
      status: "Active",
      githubUrl: "https://github.com/uni/canvas-sync"
    },
    {
      id: "prj_threat_intel",
      title: "Graph-Based Cyber Threat Monitor",
      description: "Visualizing attack patterns, vulnerability graphs, and unauthorized lateral network movement using graph topology.",
      domain: "Cybersecurity",
      status: "Seeking Contributors",
      githubUrl: "https://github.com/uni/threat-graph-monitor"
    },
    {
      id: "prj_cloud_mesh",
      title: "Automated Kubernetes Microservice Mesh",
      description: "Zero-configuration service mesh with Prometheus metrics, automated canary rollouts, and Docker orchestration.",
      domain: "Cloud & Distributed Systems",
      status: "Active",
      githubUrl: "https://github.com/uni/k8s-mesh-suite"
    }
  ],

  // Relationships: HAS_SKILL, WANTS_TO_LEARN, INTERESTED_IN, WORKED_ON, REQUIRES_SKILL, CONNECTED_TO
  relationships: [
    // Student Skills (HAS_SKILL)
    { from: "std_maya", to: "sk_python", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_maya", to: "sk_pytorch", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_maya", to: "sk_nlp", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_maya", to: "sk_docker", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_alex", to: "sk_react", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_alex", to: "sk_node", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_alex", to: "sk_typescript", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_alex", to: "sk_graphql", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_priya", to: "sk_neo4j", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_priya", to: "sk_python", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_priya", to: "sk_sql", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_priya", to: "sk_docker", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_liam", to: "sk_threat_analysis", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_liam", to: "sk_python", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_liam", to: "sk_docker", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },
    { from: "std_liam", to: "sk_neo4j", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_zoe", to: "sk_uiux", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_zoe", to: "sk_react", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_zoe", to: "sk_typescript", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_omar", to: "sk_docker", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_omar", to: "sk_k8s", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_omar", to: "sk_aws", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },
    { from: "std_omar", to: "sk_node", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_elena", to: "sk_python", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_elena", to: "sk_pytorch", type: "HAS_SKILL", props: { proficiency: "Advanced" } },
    { from: "std_elena", to: "sk_sql", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },

    { from: "std_marcus", to: "sk_python", type: "HAS_SKILL", props: { proficiency: "Intermediate" } },
    { from: "std_marcus", to: "sk_sql", type: "HAS_SKILL", props: { proficiency: "Beginner" } },

    // Student Learning Goals (WANTS_TO_LEARN)
    { from: "std_maya", to: "sk_neo4j", type: "WANTS_TO_LEARN" },
    { from: "std_alex", to: "sk_neo4j", type: "WANTS_TO_LEARN" },
    { from: "std_priya", to: "sk_k8s", type: "WANTS_TO_LEARN" },
    { from: "std_liam", to: "sk_k8s", type: "WANTS_TO_LEARN" },
    { from: "std_zoe", to: "sk_graphql", type: "WANTS_TO_LEARN" },
    { from: "std_omar", to: "sk_threat_analysis", type: "WANTS_TO_LEARN" },
    { from: "std_elena", to: "sk_neo4j", type: "WANTS_TO_LEARN" },
    { from: "std_marcus", to: "sk_react", type: "WANTS_TO_LEARN" },
    { from: "std_marcus", to: "sk_node", type: "WANTS_TO_LEARN" },

    // Student Interests (INTERESTED_IN)
    { from: "std_maya", to: "int_ai", type: "INTERESTED_IN" },
    { from: "std_maya", to: "int_graph_db", type: "INTERESTED_IN" },

    { from: "std_alex", to: "int_web_dev", type: "INTERESTED_IN" },
    { from: "std_alex", to: "int_hci", type: "INTERESTED_IN" },
    { from: "std_alex", to: "int_graph_db", type: "INTERESTED_IN" },

    { from: "std_priya", to: "int_graph_db", type: "INTERESTED_IN" },
    { from: "std_priya", to: "int_data_science", type: "INTERESTED_IN" },
    { from: "std_priya", to: "int_cloud_systems", type: "INTERESTED_IN" },

    { from: "std_liam", to: "int_cybersecurity", type: "INTERESTED_IN" },
    { from: "std_liam", to: "int_graph_db", type: "INTERESTED_IN" },

    { from: "std_zoe", to: "int_hci", type: "INTERESTED_IN" },
    { from: "std_zoe", to: "int_web_dev", type: "INTERESTED_IN" },

    { from: "std_omar", to: "int_cloud_systems", type: "INTERESTED_IN" },
    { from: "std_omar", to: "int_cybersecurity", type: "INTERESTED_IN" },

    { from: "std_elena", to: "int_ai", type: "INTERESTED_IN" },
    { from: "std_elena", to: "int_data_science", type: "INTERESTED_IN" },
    { from: "std_elena", to: "int_graph_db", type: "INTERESTED_IN" },

    { from: "std_marcus", to: "int_web_dev", type: "INTERESTED_IN" },
    { from: "std_marcus", to: "int_ai", type: "INTERESTED_IN" },

    // Student Projects (WORKED_ON)
    { from: "std_maya", to: "prj_health_bot", type: "WORKED_ON", props: { role: "ML Lead" } },
    { from: "std_alex", to: "prj_canvas_sync", type: "WORKED_ON", props: { role: "Frontend Architect" } },
    { from: "std_priya", to: "prj_graph_net", type: "WORKED_ON", props: { role: "Graph Architect" } },
    { from: "std_alex", to: "prj_graph_net", type: "WORKED_ON", props: { role: "Fullstack Contributor" } },
    { from: "std_liam", to: "prj_threat_intel", type: "WORKED_ON", props: { role: "Security Lead" } },
    { from: "std_omar", to: "prj_cloud_mesh", type: "WORKED_ON", props: { role: "DevOps Engineer" } },
    { from: "std_zoe", to: "prj_canvas_sync", type: "WORKED_ON", props: { role: "UI/UX Designer" } },

    // Project Required Skills (REQUIRES_SKILL)
    { from: "prj_graph_net", to: "sk_neo4j", type: "REQUIRES_SKILL" },
    { from: "prj_graph_net", to: "sk_node", type: "REQUIRES_SKILL" },
    { from: "prj_graph_net", to: "sk_react", type: "REQUIRES_SKILL" },

    { from: "prj_health_bot", to: "sk_python", type: "REQUIRES_SKILL" },
    { from: "prj_health_bot", to: "sk_pytorch", type: "REQUIRES_SKILL" },
    { from: "prj_health_bot", to: "sk_nlp", type: "REQUIRES_SKILL" },

    { from: "prj_canvas_sync", to: "sk_react", type: "REQUIRES_SKILL" },
    { from: "prj_canvas_sync", to: "sk_typescript", type: "REQUIRES_SKILL" },
    { from: "prj_canvas_sync", to: "sk_node", type: "REQUIRES_SKILL" },

    { from: "prj_threat_intel", to: "sk_threat_analysis", type: "REQUIRES_SKILL" },
    { from: "prj_threat_intel", to: "sk_neo4j", type: "REQUIRES_SKILL" },
    { from: "prj_threat_intel", to: "sk_python", type: "REQUIRES_SKILL" },

    { from: "prj_cloud_mesh", to: "sk_docker", type: "REQUIRES_SKILL" },
    { from: "prj_cloud_mesh", to: "sk_k8s", type: "REQUIRES_SKILL" },
    { from: "prj_cloud_mesh", to: "sk_aws", type: "REQUIRES_SKILL" },

    // Project Interest Tags (TAGGED_WITH)
    { from: "prj_graph_net", to: "int_graph_db", type: "TAGGED_WITH" },
    { from: "prj_graph_net", to: "int_web_dev", type: "TAGGED_WITH" },
    { from: "prj_health_bot", to: "int_ai", type: "TAGGED_WITH" },
    { from: "prj_canvas_sync", to: "int_web_dev", type: "TAGGED_WITH" },
    { from: "prj_canvas_sync", to: "int_hci", type: "TAGGED_WITH" },
    { from: "prj_threat_intel", to: "int_cybersecurity", type: "TAGGED_WITH" },
    { from: "prj_threat_intel", to: "int_graph_db", type: "TAGGED_WITH" },
    { from: "prj_cloud_mesh", to: "int_cloud_systems", type: "TAGGED_WITH" },

    // Student Peer Connections (CONNECTED_TO)
    { from: "std_maya", to: "std_priya", type: "CONNECTED_TO", props: { since: "2026-02-01" } },
    { from: "std_alex", to: "std_zoe", type: "CONNECTED_TO", props: { since: "2026-01-10" } },
    { from: "std_alex", to: "std_priya", type: "CONNECTED_TO", props: { since: "2026-02-14" } },
    { from: "std_omar", to: "std_alex", type: "CONNECTED_TO", props: { since: "2026-03-01" } }
  ]
};

module.exports = SEED_DATA;
