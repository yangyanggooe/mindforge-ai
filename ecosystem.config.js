module.exports = {
  apps: [{
    name: 'mindforge',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
