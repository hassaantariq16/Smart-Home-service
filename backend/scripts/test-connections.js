require('dotenv').config();
const mongoose = require('mongoose');
const { connectRedis, getRedisClient } = require('../config/redis');
const { connectCassandra, getCassandraClient } = require('../config/cassandra');
const { connectNeo4j, getNeo4jDriver } = require('../config/neo4j');
const { connectElasticsearch, getElasticsearchClient } = require('../config/elasticsearch');

async function testConnections() {
  console.log('🧪 Testing database connections...\n');

  let allPassed = true;

  // Test MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB: Connected successfully');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ MongoDB: Connection failed -', error.message);
    allPassed = false;
  }

  // Test Redis
  try {
    await connectRedis();
    const redis = getRedisClient();
    const pong = await redis.ping();
    console.log('✅ Redis: Connected successfully (ping response:', pong + ')');
    await redis.quit();
  } catch (error) {
    console.error('❌ Redis: Connection failed -', error.message);
    allPassed = false;
  }

  // Test Cassandra
  try {
    await connectCassandra();
    const cassandra = getCassandraClient();
    const result = await cassandra.execute('SELECT release_version FROM system.local');
    console.log('✅ Cassandra: Connected successfully (version:', result.rows[0].release_version + ')');
    await cassandra.shutdown();
  } catch (error) {
    console.error('❌ Cassandra: Connection failed -', error.message);
    allPassed = false;
  }

  // Test Neo4j
  try {
    await connectNeo4j();
    const driver = getNeo4jDriver();
    await driver.verifyConnectivity();
    console.log('✅ Neo4j: Connected successfully');
    await driver.close();
  } catch (error) {
    console.error('❌ Neo4j: Connection failed -', error.message);
    allPassed = false;
  }

  // Test Elasticsearch
  try {
    await connectElasticsearch();
    const esClient = getElasticsearchClient();
    const info = await esClient.info();
    console.log('✅ Elasticsearch: Connected successfully (version:', info.version.number + ')');
  } catch (error) {
    console.error('❌ Elasticsearch: Connection failed -', error.message);
    allPassed = false;
  }

  console.log('\n' + '═'.repeat(50));
  if (allPassed) {
    console.log('✅ All database connections passed!');
    console.log('You can now run: npm run init-db');
  } else {
    console.log('⚠️  Some connections failed. Please check your configuration.');
  }
  console.log('═'.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

testConnections();
