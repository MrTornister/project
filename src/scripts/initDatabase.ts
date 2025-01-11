import { initDatabase } from '../config/database.js';

initDatabase()
    .then(() => {
        console.log('Database initialization complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });