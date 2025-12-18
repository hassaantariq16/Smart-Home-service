const mongoose = require('mongoose');
const { getElasticsearchClient } = require('../config/elasticsearch');
const Service = require('../models/Service');

async function seedElasticsearch() {
    try {
        console.log('🔍 Seeding Elasticsearch with services...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_platform');
        console.log('✅ Connected to MongoDB');

        // Get Elasticsearch client
        const esClient = getElasticsearchClient();

        // Check if index exists, if yes delete it
        const indexExists = await esClient.indices.exists({ index: 'services' });
        if (indexExists) {
            await esClient.indices.delete({ index: 'services' });
            console.log('🗑️  Deleted existing services index');
        }

        // Create index with mapping
        await esClient.indices.create({
            index: 'services',
            body: {
                mappings: {
                    properties: {
                        serviceId: { type: 'keyword' },
                        name: { type: 'text', analyzer: 'standard' },
                        description: { type: 'text', analyzer: 'standard' },
                        category: { type: 'keyword' },
                        features: { type: 'text' },
                        'pricing.amount': { type: 'float' },
                        'pricing.billingCycle': { type: 'keyword' },
                        'rating.average': { type: 'float' },
                        'rating.count': { type: 'integer' },
                        provider: { type: 'keyword' },
                        isActive: { type: 'boolean' }
                    }
                }
            }
        });
        console.log('✅ Created services index with mapping');

        // Get all services from MongoDB
        const services = await Service.find({ isPremium: true });
        console.log(`📦 Found ${services.length} services in MongoDB`);

        if (services.length === 0) {
            console.log('❌ No services found in MongoDB. Please run seed-data.js first!');
            process.exit(1);
        }

        // Bulk index to Elasticsearch
        const body = services.flatMap(service => [
            { index: { _index: 'services', _id: service.serviceId } },
            {
                serviceId: service.serviceId,
                name: service.name,
                description: service.description,
                category: service.category,
                features: service.features,
                pricing: service.pricing,
                rating: service.rating,
                provider: service.provider,
                isActive: service.isActive
            }
        ]);

        const result = await esClient.bulk({ refresh: true, body });

        if (result.errors) {
            console.error('❌ Errors occurred during bulk indexing');
            result.items.forEach(item => {
                if (item.index.error) {
                    console.error(item.index.error);
                }
            });
        } else {
            console.log(`✅ Indexed ${services.length} services to Elasticsearch`);
        }

        // Verify
        const count = await esClient.count({ index: 'services' });
        console.log(`\n✅ Total documents in Elasticsearch: ${count.count}`);

        // Test search
        const searchResult = await esClient.search({
            index: 'services',
            body: {
                query: { match_all: {} },
                size: 3
            }
        });

        console.log('\n📝 Sample services:');
        searchResult.hits.hits.forEach(hit => {
            console.log(`  - ${hit._source.name} (${hit._source.category})`);
        });

        console.log('\n🎉 Elasticsearch seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding Elasticsearch:', error);
        process.exit(1);
    }
}

seedElasticsearch();
