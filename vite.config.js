import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { resolveCloudConfig } from './src/cloud-config.js';
import { resolvePersonalConfig } from './src/personal-config.js';
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    define: {
      __STORY_CLOUD_CONFIG__: JSON.stringify(resolveCloudConfig(env)),
      __PERSONAL_CLOUD_CONFIG__: JSON.stringify(resolvePersonalConfig(env)),
    },
    build: {
      rollupOptions: {
        input: {
          viewer: resolve('index.html'),
          owner: resolve('owner.html'),
          tools: resolve('tools.html'),
          share: resolve('share.html'),
        },
      },
    },
    server: { host: '0.0.0.0', allowedHosts: true },
    preview: { host: '0.0.0.0', allowedHosts: true },
  };
});
