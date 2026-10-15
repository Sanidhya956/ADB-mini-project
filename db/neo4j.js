const neo4j = require('neo4j-driver');

let driver = null;
let currentConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || 'neo4j'
};

let isConnected = false;
let lastError = null;

/**
 * Initialize or update Neo4j driver connection
 */
async function connectNeo4j(config = {}) {
  currentConfig = { ...currentConfig, ...config };
  
  if (driver) {
    try {
      await driver.close();
    } catch (e) {
      // ignore close errors
    }
    driver = null;
  }

  try {
    const auth = neo4j.auth.basic(currentConfig.user, currentConfig.password);
    driver = neo4j.driver(currentConfig.uri, auth, {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 5000 // 5 seconds fast fail
    });

    // Test connectivity
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    lastError = null;
    console.log(`[Neo4j] Connected successfully to ${currentConfig.uri} (Server: ${serverInfo.agent})`);
    return { success: true, serverInfo, uri: currentConfig.uri };
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.warn(`[Neo4j] Connection failed (${currentConfig.uri}): ${err.message}`);
    return { success: false, error: err.message, uri: currentConfig.uri };
  }
}

/**
 * Helper to normalize Neo4j types (neo4j.Integer, Date, Node, Relationship) to pure JS
 */
function toPlainObject(val) {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) return val.toNumber();
  if (Array.isArray(val)) return val.map(toPlainObject);
  if (typeof val === 'object') {
    if (val.properties) {
      // It's a Neo4j Node or Relationship
      const res = { ...toPlainObject(val.properties) };
      if (val.labels) res._labels = val.labels;
      if (val.type) res._type = val.type;
      if (val.identity && neo4j.isInt(val.identity)) res._elementId = val.identity.toString();
      return res;
    }
    const plain = {};
    for (const [k, v] of Object.entries(val)) {
      plain[k] = toPlainObject(v);
    }
    return plain;
  }
  return val;
}

/**
 * Run a Cypher query with optional parameters
 */
async function runCypher(query, params = {}, database = null) {
  if (!driver || !isConnected) {
    throw new Error('Neo4j is not connected');
  }

  const session = driver.session({
    database: database || currentConfig.database || undefined,
    defaultAccessMode: neo4j.session.WRITE
  });

  try {
    const result = await session.run(query, params);
    const records = result.records.map(record => {
      const row = {};
      record.keys.forEach(key => {
        row[key] = toPlainObject(record.get(key));
      });
      return row;
    });

    const summary = {
      query: result.summary.query.text,
      database: result.summary.database.name,
      updateStatistics: result.summary.updateStatistics ? {
        nodesCreated: result.summary.updateStatistics.updates().nodesCreated,
        nodesDeleted: result.summary.updateStatistics.updates().nodesDeleted,
        relationshipsCreated: result.summary.updateStatistics.updates().relationshipsCreated,
        relationshipsDeleted: result.summary.updateStatistics.updates().relationshipsDeleted
      } : {}
    };

    return { records, summary };
  } finally {
    await session.close();
  }
}

/**
 * Get current Neo4j connection state
 */
function getStatus() {
  return {
    isConnected,
    uri: currentConfig.uri,
    user: currentConfig.user,
    database: currentConfig.database,
    lastError
  };
}

module.exports = {
  connectNeo4j,
  runCypher,
  getStatus,
  toPlainObject
};
