require('dotenv').config();
const { getCassandraClient } = require('../config/cassandra');
const Device = require('../models/Device');
const { connectMongoDB } = require('../config/mongodb');

async function seedCassandraReadings() {
    console.log('📊 Seeding Cassandra with device readings...\\n');

    try {
        await connectMongoDB();
        const cassandra = getCassandraClient();

        const devices = await Device.find();
        console.log(`Found ${devices.length} devices`);

        if (devices.length === 0) {
            console.log('❌ No devices in MongoDB');
            process.exit(1);
        }

        // Generate readings for the past 7 days
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        let totalReadings = 0;

        for (const device of devices) {
            console.log(`\\nGenerating readings for ${device.name} (${device.deviceId})...`);

            // Generate 1 reading every hour for 7 days = 168 readings per device
            const interval = 60 * 60 * 1000; // 1 hour in milliseconds
            let readingCount = 0;

            for (let time = sevenDaysAgo.getTime(); time <= now.getTime(); time += interval) {
                const timestamp = new Date(time);

                // Generate realistic sensor values based on device type
                let values = {};

                if (device.type === 'thermostat' || device.type === 'sensor') {
                    values.temperature = 18 + Math.random() * 10; // 18-28°C
                    values.humidity = 30 + Math.random() * 40; // 30-70%
                    values.power = 50 + Math.random() * 200; // 50-250W
                } else if (device.type === 'light') {
                    values.brightness = 20 + Math.random() * 80; // 20-100%
                    values.power = 5 + Math.random() * 20; // 5-25W
                } else if (device.type === 'camera') {
                    values.power = 10 + Math.random() * 15; // 10-25W
                } else {
                    values.power = 10 + Math.random() * 100; // Default power
                }

                // Insert into Cassandra
                const query = `
          INSERT INTO smart_platform.device_readings (
            device_id, reading_time, user_id, device_type, values
          ) VALUES (?, ?, ?, ?, ?)
        `;

                await cassandra.execute(query, [
                    device.deviceId,
                    timestamp,
                    device.userId.toString(),
                    device.type,
                    values
                ], { prepare: true });

                readingCount++;
                totalReadings++;
            }

            console.log(`  ✅ Created ${readingCount} readings`);
        }

        console.log(`\\n✅ Successfully created ${totalReadings} total readings in Cassandra!\\n`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Cassandra seeding failed:', error);
        process.exit(1);
    }
}

seedCassandraReadings();
