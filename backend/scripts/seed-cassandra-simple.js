const cassandra = require('cassandra-driver');

async function seedCassandra() {
    const client = new cassandra.Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'smart_home'
    });

    try {
        await client.connect();
        console.log('✅ Connected to Cassandra');

        // Device IDs from MongoDB
        const devices = [
            { id: 'DEV_001', type: 'thermostat', userId: 'user1' },
            { id: 'DEV_002', type: 'light', userId: 'user1' },
            { id: 'DEV_003', type: 'camera', userId: 'user1' },
            { id: 'DEV_004', type: 'lock', userId: 'user1' },
            { id: 'DEV_005', type: 'sensor', userId: 'user1' }
        ];

        const query = `INSERT INTO device_readings (device_id, reading_time, user_id, device_type, values) VALUES (?, ?, ?, ?, ?)`;

        let total = 0;
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        for (const device of devices) {
            console.log(`Seeding ${device.id}...`);
            let count = 0;

            // Generate readings every hour for 7 days
            for (let time = sevenDaysAgo; time <= now; time += 3600000) {
                const values = {};

                if (device.type === 'thermostat' || device.type === 'sensor') {
                    values.temperature = 18 + Math.random() * 10;
                    values.humidity = 30 + Math.random() * 40;
                    values.power = 50 + Math.random() * 200;
                } else if (device.type === 'light') {
                    values.brightness = 20 + Math.random() * 80;
                    values.power = 5 + Math.random() * 20;
                } else {
                    values.power = 10 + Math.random() * 100;
                }

                await client.execute(query, [
                    device.id,
                    new Date(time),
                    device.userId,
                    device.type,
                    values
                ], { prepare: true });

                count++;
            }

            total += count;
            console.log(`  ✅ ${count} readings`);
        }

        console.log(`\\n✅ Total: ${total} readings created!`);
        await client.shutdown();
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedCassandra();
