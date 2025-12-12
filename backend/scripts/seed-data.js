require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Device = require('../models/Device');
const Service = require('../models/Service');
const { connectMongoDB } = require('../config/mongodb');
const { getElasticsearchClient } = require('../config/elasticsearch');
const { getNeo4jSession } = require('../config/neo4j');

async function seedData() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    await connectMongoDB();

    // Create sample users
    console.log('👥 Creating sample users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.create([
      {
        email: 'john@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          coordinates: {
            type: 'Point',
            coordinates: [-74.0060, 40.7128]
          }
        },
        subscription: {
          plan: 'premium',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        stats: {
          totalDevices: 5,
          totalServices: 3,
          energySaved: 1250.5,
          costSavings: 350.25
        }
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA',
          coordinates: {
            type: 'Point',
            coordinates: [-118.2437, 34.0522]
          }
        },
        subscription: {
          plan: 'basic',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        stats: {
          totalDevices: 3,
          totalServices: 2,
          energySaved: 680.0,
          costSavings: 145.50
        }
      }
    ]);
    console.log(`  ✅ Created ${users.length} users`);

    // Create sample devices
    console.log('📱 Creating sample devices...');
    const devices = await Device.create([
      {
        deviceId: 'DEV_001',
        userId: users[0]._id,
        name: 'Living Room Thermostat',
        type: 'thermostat',
        manufacturer: 'Nest',
        model: 'Learning Thermostat 3rd Gen',
        location: { room: 'Living Room', floor: '1st Floor' },
        status: {
          online: true,
          battery: 95,
          signalStrength: 85,
          lastSeen: new Date()
        },
        lastDataPoint: {
          timestamp: new Date(),
          values: { temperature: 72, humidity: 45, mode: 'cooling' }
        }
      },
      {
        deviceId: 'DEV_002',
        userId: users[0]._id,
        name: 'Bedroom Smart Light',
        type: 'light',
        manufacturer: 'Philips',
        model: 'Hue White and Color',
        location: { room: 'Bedroom', floor: '2nd Floor' },
        status: {
          online: true,
          signalStrength: 90,
          lastSeen: new Date()
        },
        lastDataPoint: {
          timestamp: new Date(),
          values: { brightness: 80, color: '#FFD700', power: true }
        }
      },
      {
        deviceId: 'DEV_003',
        userId: users[0]._id,
        name: 'Front Door Camera',
        type: 'camera',
        manufacturer: 'Ring',
        model: 'Video Doorbell Pro',
        location: { room: 'Front Door', floor: '1st Floor' },
        status: {
          online: true,
          signalStrength: 78,
          lastSeen: new Date()
        },
        lastDataPoint: {
          timestamp: new Date(),
          values: { recording: true, motionDetected: false, nightVision: false }
        }
      },
      {
        deviceId: 'DEV_004',
        userId: users[0]._id,
        name: 'Smart Door Lock',
        type: 'lock',
        manufacturer: 'August',
        model: 'Smart Lock Pro',
        location: { room: 'Front Door', floor: '1st Floor' },
        status: {
          online: true,
          battery: 75,
          signalStrength: 82,
          lastSeen: new Date()
        },
        lastDataPoint: {
          timestamp: new Date(),
          values: { locked: true, autoLock: true, keypadEnabled: true }
        }
      },
      {
        deviceId: 'DEV_005',
        userId: users[0]._id,
        name: 'Garage Sensor',
        type: 'sensor',
        manufacturer: 'SmartThings',
        model: 'Multipurpose Sensor',
        location: { room: 'Garage', floor: 'Ground Floor' },
        status: {
          online: true,
          battery: 88,
          signalStrength: 70,
          lastSeen: new Date()
        },
        lastDataPoint: {
          timestamp: new Date(),
          values: { temperature: 65, humidity: 55, open: false }
        }
      }
    ]);
    console.log(`  ✅ Created ${devices.length} devices`);

    // Create sample services
    console.log('🛠️  Creating sample services...');
    const services = await Service.create([
      {
        serviceId: 'SVC_001',
        name: 'Smart Home Automation Suite',
        description: 'Complete home automation package with AI-powered scheduling and energy optimization',
        category: 'automation',
        provider: {
          name: 'HomeAI Technologies',
          email: 'support@homeai.com',
          website: 'https://homeai.com'
        },
        pricing: {
          model: 'subscription',
          amount: 29.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'AI-powered scheduling',
          'Energy optimization',
          'Voice control integration',
          'Multi-device automation',
          '24/7 monitoring'
        ],
        rating: { average: 4.8, count: 1250 },
        stats: { subscribers: 15420, views: 45200, installations: 14800 },
        availability: { regions: ['USA', 'Canada', 'UK'], languages: ['en', 'es', 'fr'], support24x7: true }
      },
      {
        serviceId: 'SVC_002',
        name: 'Advanced Security Monitoring',
        description: '24/7 professional security monitoring with instant alerts and emergency response',
        category: 'security',
        provider: {
          name: 'SecureHome Inc',
          email: 'support@securehome.com',
          website: 'https://securehome.com'
        },
        pricing: {
          model: 'subscription',
          amount: 49.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          '24/7 professional monitoring',
          'Instant mobile alerts',
          'Emergency response',
          'Video verification',
          'Cellular backup'
        ],
        rating: { average: 4.9, count: 2100 },
        stats: { subscribers: 28500, views: 78000, installations: 27000 },
        availability: { regions: ['USA', 'Canada'], languages: ['en', 'es'], support24x7: true }
      },
      {
        serviceId: 'SVC_003',
        name: 'Energy Optimizer Pro',
        description: 'Reduce energy bills by up to 40% with intelligent power management',
        category: 'energy',
        provider: {
          name: 'EcoSmart Solutions',
          email: 'info@ecosmart.com',
          website: 'https://ecosmart.com'
        },
        pricing: {
          model: 'subscription',
          amount: 19.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'Real-time energy monitoring',
          'Smart scheduling',
          'Bill predictions',
          'Solar integration',
          'Carbon footprint tracking'
        ],
        rating: { average: 4.6, count: 890 },
        stats: { subscribers: 12300, views: 34000, installations: 11500 },
        availability: { regions: ['USA', 'Canada', 'UK', 'Australia'], languages: ['en'], support24x7: false }
      },
      {
        serviceId: 'SVC_004',
        name: 'Multi-Room Audio System',
        description: 'Whole-home audio with high-fidelity sound and seamless control',
        category: 'entertainment',
        provider: {
          name: 'SonicWave Audio',
          email: 'hello@sonicwave.com',
          website: 'https://sonicwave.com'
        },
        pricing: {
          model: 'subscription',
          amount: 14.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'Multi-room synchronization',
          'Hi-Fi streaming',
          'Voice control',
          'Spotify/Apple Music integration',
          'Custom playlists'
        ],
        rating: { average: 4.7, count: 1560 },
        stats: { subscribers: 18700, views: 52000, installations: 17200 },
        availability: { regions: ['USA', 'Canada', 'UK', 'Europe'], languages: ['en', 'de', 'fr', 'es'], support24x7: false }
      },
      {
        serviceId: 'SVC_005',
        name: 'Health & Wellness Monitor',
        description: 'Track air quality, temperature, and humidity for optimal home health',
        category: 'health',
        provider: {
          name: 'HealthyHome Labs',
          email: 'support@healthyhome.com',
          website: 'https://healthyhome.com'
        },
        pricing: {
          model: 'subscription',
          amount: 24.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        features: [
          'Air quality monitoring',
          'Allergen detection',
          'Temperature & humidity tracking',
          'Health recommendations',
          'Sleep optimization'
        ],
        rating: { average: 4.5, count: 720 },
        stats: { subscribers: 9800, views: 28000, installations: 9200 },
        availability: { regions: ['USA', 'Canada'], languages: ['en'], support24x7: true }
      },
      {
        serviceId: 'SVC_006',
        name: 'Smart Lighting Scenes',
        description: 'Create perfect ambiance with customizable lighting scenes',
        category: 'automation',
        provider: {
          name: 'LightMaster Inc',
          email: 'info@lightmaster.com',
          website: 'https://lightmaster.com'
        },
        pricing: {
          model: 'free',
          amount: 0,
          currency: 'USD',
          billingCycle: 'one-time'
        },
        features: [
          'Pre-set lighting scenes',
          'Color temperature adjustment',
          'Scheduling',
          'Motion activation',
          'Circadian rhythm support'
        ],
        rating: { average: 4.4, count: 2340 },
        stats: { subscribers: 45600, views: 120000, installations: 43200 },
        availability: { regions: ['Worldwide'], languages: ['en', 'es', 'fr', 'de', 'zh'], support24x7: false }
      }
    ]);
    console.log(`  ✅ Created ${services.length} services`);

    // Index services in Elasticsearch
    console.log('🔍 Indexing services in Elasticsearch...');
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
      console.log('  ✅ Services indexed in Elasticsearch');
    } catch (esError) {
      console.log('  ⚠️  Elasticsearch indexing skipped:', esError.message);
    }

    // Create relationships in Neo4j
    console.log('🔗 Creating relationships in Neo4j...');
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

      // Create subscriptions
      await session.run(`
        MATCH (u:User {userId: $userId})
        MATCH (s1:Service {serviceId: 'SVC_001'})
        MATCH (s2:Service {serviceId: 'SVC_002'})
        MATCH (s3:Service {serviceId: 'SVC_003'})
        MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s1)
        MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s2)
        MERGE (u)-[:SUBSCRIBED_TO {timestamp: datetime()}]->(s3)
      `, { userId: users[0]._id.toString() });

      await session.close();
      console.log('  ✅ Neo4j relationships created');
    } catch (neo4jError) {
      console.log('  ⚠️  Neo4j seeding skipped:', neo4jError.message);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();
