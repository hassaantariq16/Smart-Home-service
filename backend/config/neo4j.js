const neo4j = require('neo4j-driver');

let driver = null;

async function connectNeo4j() {
  if (driver) {
    console.log('✅ Neo4j already connected');
    return driver;
  }

  try {
    driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password123'
      ),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2000
      }
    );

    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connected successfully');

    return driver;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    throw error;
  }
}

function getNeo4jDriver() {
  if (!driver) {
    throw new Error('Neo4j not connected');
  }
  return driver;
}

async function getNeo4jSession() {
  const driver = getNeo4jDriver();
  return driver.session();
}

module.exports = { connectNeo4j, getNeo4jDriver, getNeo4jSession };
