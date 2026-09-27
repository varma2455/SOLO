import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { apiApp } from './server/api.js';

function apiServerPlugin() {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(apiApp);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  server: {
    host: true,
    port: 5173
  }
});
