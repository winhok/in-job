module.exports = {
  apps: [
    {
      name: 'in-job-server',
      cwd: './server',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env_production: { NODE_ENV: 'production', PORT: 3000 },
    },
    {
      name: 'in-job-web',
      cwd: './apps/web',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env_production: { NODE_ENV: 'production', HOST: '0.0.0.0', PORT: 8080 },
    },
  ],
};
