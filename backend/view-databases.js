require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cassandra = require('cassandra-driver');
const neo4j = require('neo4j-driver');
const { Client } = require('@elastic/elasticsearch');

// Initialize connections
const redis = new Redis(process.env.REDIS_URL);
const cassandraClient = new cassandra.Client({
    contactPoints: ['localhost:9042'],
    localDataCenter: 'datacenter1',
    keyspace: 'smart_platform'
});
const neo4jDriver = neo4j.driver(
    process.env.NEO4J_URL,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);
const elasticClient = new Client({ node: process.env.ELASTICSEARCH_URL });

async function viewAllData() {
    try {
        console.log('\n🔍 ============ VIEWING ALL DATABASE DATA ============\n');

        // 1. MONGODB DATA
        console.log('📊 MONGODB DATA:');
        console.log('─'.repeat(60));
        await mongoose.connect(process.env.MONGODB_URL);
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const Device = mongoose.model('Device', new mongoose.Schema({}, { strict: false }), 'devices');
        const Service = mongoose.model('Service', new mongoose.Schema({}, { strict: false }), 'services');

        const users = await User.find({}).limit(5);
        console.log(`\n👥 Users (${users.length}):`);
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
        });

        const devices = await Device.find({}).limit(10);
        console.log(`\n📱 Devices (${devices.length}):`);
        devices.forEach(device => {
            console.log(`  - ${device.name} (${device.type}) - Status: ${device.status.online ? 'Online' : 'Offline'}`);
        });

        const services = await Service.find({}).limit(10);
        console.log(`\n🛍️ Services (${services.length}):`);
        services.forEach(service => {
            console.log(`  - ${service.name} (${service.category}) - $${service.pricing.amount || 0}/${service.pricing.interval}`);
        });

        // 2. REDIS DATA
        console.log('\n\n📊 REDIS DATA (Cache):');
        console.log('─'.repeat(60));
        const redisKeys = await redis.keys('*');
        console.log(`\n🔑 Keys (${redisKeys.length}):`);
        for (const key of redisKeys.slice(0, 10)) {
            const type = await redis.type(key);
            const ttl = await redis.ttl(key);
            console.log(`  - ${key} (${type}) - TTL: ${ttl}s`);
            
            if (type === 'string') {
                const value = await redis.get(key);
                try {
                    const parsed = JSON.parse(value);
                    console.log(`    Value: ${JSON.stringify(parsed).substring(0, 100)}...`);
                } catch {
                    console.log(`    Value: ${value.substring(0, 100)}...`);
                }
            }
        }

        // 3. CASSANDRA DATA
        console.log('\n\n📊 CASSANDRA DATA (Time-Series):');
        console.log('─'.repeat(60));
        await cassandraClient.connect();
        
        const sensorQuery = 'SELECT * FROM sensor_data LIMIT 10';
        const sensorResult = await cassandraClient.execute(sensorQuery);
        console.log(`\n🌡️ Sensor Data (${sensorResult.rows.length}):`);
        sensorResult.rows.forEach(row => {
            console.log(`  - Device: ${row.device_id} | Time: ${row.timestamp} | Temp: ${row.temperature}°C | Humidity: ${row.humidity}%`);
        });

        const energyQuery = 'SELECT * FROM energy_consumption LIMIT 10';
        const energyResult = await cassandraClient.execute(energyQuery);
        console.log(`\n⚡ Energy Consumption (${energyResult.rows.length}):`);
        energyResult.rows.forEach(row => {
            console.log(`  - Device: ${row.device_id} | Time: ${row.timestamp} | Usage: ${row.energy_consumed} kWh | Cost: $${row.cost}`);
        });

        // 4. NEO4J DATA
        console.log('\n\n📊 NEO4J DATA (Graph):');
        console.log('─'.repeat(60));
        const session = neo4jDriver.session();
        
        const usersQuery = 'MATCH (u:User) RETURN u LIMIT 5';
        const usersResult = await session.run(usersQuery);
        console.log(`\n👥 Users (${usersResult.records.length}):`);
        usersResult.records.forEach(record => {
            const user = record.get('u').properties;
            console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
        });

        const subscriptionsQuery = `
            MATCH (u:User)-[s:SUBSCRIBED_TO]->(srv:Service)
            RETURN u.email as user, srv.name as service, s.subscribedAt as date
            LIMIT 10
        `;
        const subsResult = await session.run(subscriptionsQuery);
        console.log(`\n🔗 Subscriptions (${subsResult.records.length}):`);
        subsResult.records.forEach(record => {
            console.log(`  - ${record.get('user')} → ${record.get('service')} (${new Date(record.get('date')).toLocaleDateString()})`);
        });

        await session.close();

        // 5. ELASTICSEARCH DATA
        console.log('\n\n📊 ELASTICSEARCH DATA (Search Index):');
        console.log('─'.repeat(60));
        
        const searchResult = await elasticClient.search({
            index: 'services',
            body: {
                query: { match_all: {} },
                size: 10
            }
        });
        
        console.log(`\n🔍 Indexed Services (${searchResult.hits.hits.length}):`);
        searchResult.hits.hits.forEach(hit => {
            const service = hit._source;
            console.log(`  - ${service.name} (${service.category}) - Rating: ${service.rating}/5`);
        });

        console.log('\n\n✅ Data retrieval complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        await redis.quit();
        await cassandraClient.shutdown();
        await neo4jDriver.close();
        process.exit(0);
    }
}

viewAllData();
