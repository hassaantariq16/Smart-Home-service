const cassandra = require('cassandra-driver');

let client = null;

async function connectCassandra() {
  if (client) {
    console.log('✅ Cassandra already connected');
    return client;
  }

  try {
    // Create keyspace first before connecting to it
    await createKeyspace();

    client = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_CONTACT_POINTS || 'localhost'],
      localDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER || 'datacenter1',
      keyspace: process.env.CASSANDRA_KEYSPACE || 'smart_platform',
      pooling: {
        coreConnectionsPerHost: {
          [cassandra.types.distance.local]: 2,
          [cassandra.types.distance.remote]: 1
        }
      }
    });

    await client.connect();
    console.log('✅ Cassandra connected successfully');

    return client;
  } catch (error) {
    console.error('❌ Cassandra connection failed:', error.message);
    throw error;
  }
}

async function createKeyspace() {
  const keyspace = process.env.CASSANDRA_KEYSPACE || 'smart_platform';
  
  try {
    const tempClient = new cassandra.Client({
      contactPoints: [process.env.CASSANDRA_CONTACT_POINTS || 'localhost'],
      localDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER || 'datacenter1'
    });

    await tempClient.connect();

    const query = `
      CREATE KEYSPACE IF NOT EXISTS ${keyspace}
      WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `;

    await tempClient.execute(query);
    await tempClient.shutdown();
    
  } catch (error) {
    console.error('⚠️  Error creating keyspace:', error.message);
  }
}

function getCassandraClient() {
  if (!client) {
    throw new Error('Cassandra not connected');
  }
  return client;
}

module.exports = { connectCassandra, getCassandraClient };
