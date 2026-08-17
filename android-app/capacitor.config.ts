import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cubesolver.app',
  appName: 'CubeSolver',
  webDir: 'dist',
  backgroundColor: '#08090c',
  android: { backgroundColor: '#08090c' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#08090c',
      showSpinner: false,
    },
  },
};

export default config;
