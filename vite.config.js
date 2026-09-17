import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const iosProject = readFileSync(
  new URL('./ios/App/App.xcodeproj/project.pbxproj', import.meta.url),
  'utf8'
);
const nativeBuildNumber =
  iosProject.match(/CURRENT_PROJECT_VERSION = (\d+);/)?.[1] ?? '';

export default defineConfig({
  plugins: [react()],
  define: {
    __NATIVE_BUILD_NUMBER__: JSON.stringify(nativeBuildNumber),
  },
});
