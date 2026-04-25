module.exports = {
    apps: [{
        name: 'sribalaji-backend',
        script: './backend/dist/src/main.js',
        instances: 1, // Or 'max' to use all CPU cores
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
            // Add other production environment variables here or load them from .env file on server
        }
    }]
};
