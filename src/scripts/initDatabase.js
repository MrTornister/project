import { initDatabase } from '../config/database.js';

try {
    await initDatabase();
    console.log('Database initialization complete');
    process.exit(0);
} catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
}
