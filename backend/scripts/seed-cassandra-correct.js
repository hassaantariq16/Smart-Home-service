const cassandra = require('cassandra-driver');

async function seedCassandra() {
    const client = new cassandra.Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        keyspace: 'smart_platform'  // CORRECT keyspace
    });

    try {
        await client.connect();
        console.log('✅ Connected to Cassandra (smart_platform)\\n');

        const devices = ['DEV_001', 'DEV_002', 'DEV_003', 'DEV_004', 'DEV_005'];
        const query = `INSERT INTO device_readings (device_id, date, timestamp, temperature, humidity, power_consumption, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        let total = 0;
        const now = new Date();

        for (const deviceId of devices) {
            console.log(`Seeding ${deviceId}...`);
            let count = 0;

            // Generate readings for past 7 days, every hour (168 readings per device)
            for (let daysAgo = 7; daysAgo >= 0; daysAgo--) {
                for (let hour = 0; hour < 24; hour++) {
                    const time = new Date(now);
                    time.setDate(time.getDate() - daysAgo);
                    time.setHours(hour, 0, 0, 0);

                    const dateStr = time.toISOString().split('T')[0]; // YYYY-MM-DD
                    const temp = 18 + Math.random() * 10; // 18-28°C
                    const humid = 30 + Math.random() * 40; // 30-70%
                    const power = 50 + Math.random() * 200; // 50-250W

                    await client.execute(query, [
                        deviceId,
                        dateStr,
                        time,
                        temp,
                        humid,
                        power,
                        'online'
                    ], { prepare: true });

                    count++;
                }
            }

            total += count;
            console.log(`  ✅ Created ${count} readings`);
        }

        console.log(`\\n🎉 Successfully created ${total} total readings!\\n`);
        await client.shutdown();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedCassandra();
