const { getCassandraClient } = require('../config/cassandra');

async function initializeCassandraTables() {
  const client = getCassandraClient();
  const keyspace = process.env.CASSANDRA_KEYSPACE || 'smart_platform';

  console.log('📦 Initializing Cassandra tables...');

  try {
    // Use keyspace
    await client.execute(`USE ${keyspace}`);

    // Create device_readings table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS device_readings (
        device_id text,
        date text,
        timestamp timestamp,
        temperature double,
        humidity double,
        power_consumption double,
        status text,
        PRIMARY KEY ((device_id, date), timestamp)
      ) WITH CLUSTERING ORDER BY (timestamp DESC)
    `);
    console.log('  ✅ Table: device_readings');

    // Create system_logs table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS system_logs (
        log_id uuid,
        date text,
        timestamp timestamp,
        user_id text,
        event_type text,
        description text,
        metadata text,
        PRIMARY KEY ((date), timestamp, log_id)
      ) WITH CLUSTERING ORDER BY (timestamp DESC, log_id ASC)
    `);
    console.log('  ✅ Table: system_logs');

    // Create analytics_events table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        event_id uuid,
        date text,
        timestamp timestamp,
        user_id text,
        event_name text,
        properties text,
        PRIMARY KEY ((user_id, date), timestamp, event_id)
      ) WITH CLUSTERING ORDER BY (timestamp DESC, event_id ASC)
    `);
    console.log('  ✅ Table: analytics_events');

    console.log('✅ Cassandra tables initialized\n');

  } catch (error) {
    console.error('❌ Error initializing Cassandra tables:', error.message);
    throw error;
  }
}

module.exports = { initializeCassandraTables };
