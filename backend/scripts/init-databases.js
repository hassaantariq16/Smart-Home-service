require('dotenv').config();
const { connectMongoDB } = require('../config/mongodb');
const { connectRedis } = require('../config/redis');
const { connectCassandra } = require('../config/cassandra');
const { connectNeo4j } = require('../config/neo4j');
const { connectElasticsearch } = require('../config/elasticsearch');
const { initializeCassandraTables } = require('./init-cassandra');
const { initializeElasticsearchIndices } = require('./init-elasticsearch');

async function initializeDatabases() {
  console.log('🚀 Initializing all databases...\n');

  try {
    // Connect to all databases
    await connectMongoDB();
    await connectRedis();
    await connectCassandra();
    await connectNeo4j();
    await connectElasticsearch();

    console.log('✅ All database connections established\n');

    // Initialize schemas/tables
    await initializeCassandraTables();
    await initializeElasticsearchIndices();

    console.log('✅ All databases initialized successfully!');
    console.log('\n🎉 You can now start the server with: npm run dev\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabases();
