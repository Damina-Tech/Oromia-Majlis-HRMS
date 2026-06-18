module.exports = {
  apps: [
    {
      name: "hrms-api",
      cwd: "/var/www/hrms/backend",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "750M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "/var/log/hrms/api-error.log",
      out_file: "/var/log/hrms/api-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
