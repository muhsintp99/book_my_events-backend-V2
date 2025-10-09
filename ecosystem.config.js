module.exports = {
  apps: [{
    name: 'backend',
    script: './server.js', // or your main file
    watch: true,
    ignore_watch: [
      'node_modules',
      'Uploads',           // Ignore entire Uploads directory
      'Uploads/**/*',      // Ignore all files inside Uploads
      'logs',
      '*.log'
    ],
    node_args: '--max-old-space-size=4096',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
