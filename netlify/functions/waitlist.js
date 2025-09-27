// netlify/functions/waitlist.js
const { Pool } = require('pg');

let pool;

// reuse across invocations (reduces connection overhead)
if (!pool) {
    pool = new Pool({
        connectionString: process.env.NEON_DB_URL,
        ssl: { rejectUnauthorized: false }
    });
}

exports.handler = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false; // safe for serverless
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, city, email, phone, role, need, notes } = body;

        const res = await pool.query(
            `INSERT INTO waitlist (name, city, email, phone, role, need, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, created_at`,
            [name, city, email, phone, role, need, notes]
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, id: res.rows[0].id, created_at: res.rows[0].created_at })
        };
    } catch (err) {
        console.error('DB error:', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
