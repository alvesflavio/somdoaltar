import 'dotenv/config';
import { pool, query } from '../db.js';

const result = await query('select current_database() as database, current_user as user, now() as now');

await pool.end();
console.log(JSON.stringify(result.rows[0], null, 2));
