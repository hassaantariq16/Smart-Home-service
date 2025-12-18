require('dotenv').config();
const { getNeo4jSession } = require('../config/neo4j');
const User = require('../models/User');
const Service = require('../models/Service');
const { connectMongoDB } = require('../config/mongodb');

async function seedNeo4j() {
    console.log('🔗 Seeding Neo4j with graph data...\\n');

    try {
        await connectMongoDB();

        const users = await User.find();
        const services = await Service.find();

        console.log(`Found ${users.length} users and ${services.length} services in MongoDB`);

        if (users.length === 0 || services.length === 0) {
            console.log('❌ No data in MongoDB. Run seed-data.js first.');
            process.exit(1);
        }

        const session = getNeo4jSession();

        try {
            // Clear existing data
            console.log('\\n🗑️  Clearing existing Neo4j data...');
            await session.run('MATCH (n) DETACH DELETE n');

            // Create user nodes
            console.log('\\n👥 Creating user nodes...');
            for (const user of users) {
                await session.run(`
          CREATE (u:User {
            userId: $userId,
            email: $email,
            name: $name,
            createdAt: datetime()
          })
        `, {
                    userId: user._id.toString(),
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`
                });
            }
            console.log(`  ✅ Created ${users.length} user nodes`);

            // Create service nodes
            console.log('\\n🛠️  Creating service nodes...');
            for (const service of services) {
                await session.run(`
          CREATE (s:Service {
            serviceId: $serviceId,
            name: $name,
            category: $category,
            price: $price,
            rating: $rating
          })
        `, {
                    serviceId: service.serviceId,
                    name: service.name,
                    category: service.category,
                    price: service.pricing.amount,
                    rating: service.rating.average
                });
            }
            console.log(`  ✅ Created ${services.length} service nodes`);

            // Create subscriptions for first user (john@example.com)
            console.log('\\n🔗 Creating subscription relationships...');
            const firstUser = users[0];
            const servicesToSubscribe = services.slice(0, 3); // Subscribe to first 3 services

            for (const service of servicesToSubscribe) {
                await session.run(`
          MATCH (u:User {userId: $userId})
          MATCH (s:Service {serviceId: $serviceId})
          CREATE (u)-[:SUBSCRIBED_TO {
            timestamp: datetime(),
            status: 'active'
          }]->(s)
        `, {
                    userId: firstUser._id.toString(),
                    serviceId: service.serviceId
                });
            }
            console.log(`  ✅ Created ${servicesToSubscribe.length} subscriptions for ${firstUser.email}`);

            // Also create some subscriptions for similarity (for collaborative filtering)
            if (users.length > 1) {
                console.log('\\n🔗 Creating additional subscriptions for recommendations...');
                const secondUser = users[1];
                const sharedServices = services.slice(0, 2); // Share 2 services with first user
                const uniqueService = services[3]; // One unique service

                for (const service of sharedServices) {
                    await session.run(`
            MATCH (u:User {userId: $userId})
            MATCH (s:Service {serviceId: $serviceId})
            CREATE (u)-[:SUBSCRIBED_TO {
              timestamp: datetime(),
              status: 'active'
            }]->(s)
          `, {
                        userId: secondUser._id.toString(),
                        serviceId: service.serviceId
                    });
                }

                if (uniqueService) {
                    await session.run(`
            MATCH (u:User {userId: $userId})
            MATCH (s:Service {serviceId: $serviceId})
            CREATE (u)-[:SUBSCRIBED_TO {
              timestamp: datetime(),
              status: 'active'
            }]->(s)
          `, {
                        userId: secondUser._id.toString(),
                        serviceId: uniqueService.serviceId
                    });
                }
                console.log(`  ✅ Created subscriptions for ${secondUser.email}`);
            }

            // Verify the graph
            console.log('\\n📊 Verifying graph data...');
            const nodeCount = await session.run('MATCH (n) RETURN count(n) as total');
            const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as total');

            console.log(`  Nodes: ${nodeCount.records[0].get('total').toNumber()}`);
            console.log(`  Relationships: ${relCount.records[0].get('total').toNumber()}`);

            console.log('\\n✅ Neo4j seeding completed successfully!\\n');

        } finally {
            await session.close();
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Neo4j seeding failed:', error);
        process.exit(1);
    }
}

seedNeo4j();
