const { getElasticsearchClient } = require('../config/elasticsearch');

async function initializeElasticsearchIndices() {
  const client = getElasticsearchClient();

  console.log('🔍 Initializing Elasticsearch indices...');

  try {
    // Create services index
    const servicesIndexExists = await client.indices.exists({ index: 'services' });
    
    if (!servicesIndexExists) {
      await client.indices.create({
        index: 'services',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'stop', 'snowball']
                }
              }
            }
          },
          mappings: {
            properties: {
              serviceId: { type: 'keyword' },
              name: { 
                type: 'text', 
                analyzer: 'custom_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: { 
                type: 'text', 
                analyzer: 'custom_analyzer'
              },
              category: { type: 'keyword' },
              features: { type: 'text', analyzer: 'custom_analyzer' },
              'rating.average': { type: 'float' },
              'pricing.amount': { type: 'float' },
              'pricing.currency': { type: 'keyword' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      console.log('  ✅ Index: services');
    } else {
      console.log('  ℹ️  Index "services" already exists');
    }

    console.log('✅ Elasticsearch indices initialized\n');

  } catch (error) {
    console.error('❌ Error initializing Elasticsearch indices:', error.message);
    throw error;
  }
}

module.exports = { initializeElasticsearchIndices };
