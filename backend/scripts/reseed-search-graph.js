require('dotenv').config();
const Service = require('../models/Service');
const User = require('../models/User');
const { connectMongoDB } = require('../config/mongodb');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { getNeo4jSession } = require('../config/neo4j');

async function reseedSearchAndGraph() {
    console.log('🔄 Re-seeding Elasticsearch and Neo4j from existing MongoDB data...\\n');

    try {
        await connectMongoDB();

        // Get existing users and services from MongoDB
        const users = await User.find();
        const services = await Service.find();

        console.log(`📊 Found ${users.length} users and ${services.length} services in MongoDB`);

        if (services.length === 0) {
            console.log('❌ No services found in MongoDB. Please run the full seed script first.');
            process.exit(1);
        }

        // Index services in Elasticsearch
        console.log('\\n🔍 Indexing services in Elasticsearch...');
        try {
            const esClient = getElasticsearchClient();

            for (const service of services) {
                await esClient.index({
                    index: 'services',
                    id: service.serviceId,
                    document: {
                        serviceId: service.serviceId,
                        name: service.name,
                        description: service.description,
                        category: service.category,
                        features: service.features,
                        'rating.average': service.rating.average,
                        'pricing.amount': service.pricing.amount,
                        'pricing.currency': service.pricing.currency,
                        isActive: service.isActive,
                        createdAt: service.createdAt
                    }
                });
            }

            await esClient.indices.refresh({ index: 'services' });
            console.log('  ✅ Successfully indexed', services.length, 'services in Elasticsearch');
        } catch (esError) {
            console.log('  ❌ Elasticsearch error:', esError.message);
        }

        // Create relationships in Neo4j
        console.log('\\n🔗 Creating relationships in Neo4j...');
        try {
            const session = getNeo4jSession();

            // Create user nodes
            for (const user of users) {
                await session.run(`
          MERGE (u:User {userId: $userId})
          SET u.email = $email, u.name = $name
        `, {
                    userId: user._id.toString(),
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`
                });
            }
            console.log('  ✅ Created', users.length, 'user nodes');

            // Create service nodes
            for (const service of services) {
                await session.run(`
          MERGE (s:Service {serviceId: $serviceId})
          SET s.name = $name, s.category = $category
        `, {
                    serviceId: service.serviceId,
                    name: service.name,
                    category: service.category
                });
            }
            console.log('  ✅ Created', services.length, 'service nodes');

            // Create sample subscriptions for first user
            if (users.length > 0 && services.length >= 3) {
                await session.run(`
          MATCH (u:User {userId: $userId})
          MATCH (s1:Service {serviceId: $s1})
          MATCH (s2:Service {serviceId: $s2})
          MATCH (s3:Service {serviceId: $s3})
          MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s1)
          MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s2)
          MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s3)
        `, {
                    userId: users[0]._id.toString(),
                    s1: services[0].serviceId,
                    s2: services[1].serviceId,
                    s3: services[2].serviceId
                });
                console.log('  ✅ Created sample subscriptions');
            }

            await session.close();
            console.log('  ✅ Neo4j relationships created');
        } catch (neo4jError) {
            console.log('  ❌ Neo4j error:', neo4jError.message);
        }

        console.log('\\n✅ Re-seeding completed successfully!\\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Re-seeding failed:', error);
        process.exit(1);
    }
}

reseedSearchAndGraph();
