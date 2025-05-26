import { Pool } from 'pg';
import { DATABASE_URL } from './index'; // This imports from src/config/index.ts

if (!DATABASE_URL) {
    // This check is a bit redundant as index.ts already exits if DATABASE_URL is missing,
    // but it's good for explicitness within this file's context.
    console.error("FATAL ERROR: DATABASE_URL is not defined. This should have been caught in config/index.ts.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    // ssl: { rejectUnauthorized: false } // Uncomment and configure if your DB requires SSL (e.g., cloud DBs)
});

pool.on('connect', () => {
    console.log('Successfully connected to PostgreSQL database via connection pool!');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client from pool', err);
    // You might want to decide if certain errors should cause the application to exit
    // process.exit(-1); 
});

// Optional: Test query to ensure connection works on startup
// This is helpful for initial setup verification.
// You can comment it out or remove it once you're confident.
(async () => {
    try {
        const client = await pool.connect();
        console.log('PostgreSQL pool connected, performing test query...');
        const res = await client.query('SELECT NOW()');
        console.log('PostgreSQL test query successful:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('Error during initial PostgreSQL pool test query:', err);
        // Depending on the error, you might want to exit if the DB is critical for startup
        // process.exit(1);
    }
})();


export default pool;
