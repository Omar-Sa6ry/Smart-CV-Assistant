const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_pqNO6CZHe1Rw@ep-icy-mud-apx0xvw2.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require",
});
client.connect()
  .then(() => {
    console.log('Connected successfully');
    client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
