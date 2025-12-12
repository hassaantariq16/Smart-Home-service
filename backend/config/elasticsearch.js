const { Client } = require('@elastic/elasticsearch');

let client = null;

async function connectElasticsearch() {
  if (client) {
    console.log('✅ Elasticsearch already connected');
    return client;
  }

  try {
    client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: false
    });

    // Test connection
    await client.ping();
    console.log('✅ Elasticsearch connected successfully');

    return client;
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    throw error;
  }
}

function getElasticsearchClient() {
  if (!client) {
    throw new Error('Elasticsearch not connected');
  }
  return client;
}

module.exports = { connectElasticsearch, getElasticsearchClient };
