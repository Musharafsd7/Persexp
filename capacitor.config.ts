import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.happy79.persexp',
  appName: 'PersExp',
  webDir: 'out',
  backgroundColor: '#ffffff',
  plugins: {
    // Routes fetch() through native HTTP so stock quotes work without CORS limits.
    CapacitorHttp: { enabled: true },
    SplashScreen: { launchAutoHide: false, backgroundColor: '#ffffff' },
    StatusBar: { overlaysWebView: false, style: 'LIGHT', backgroundColor: '#ffffff' },
  },
}

export default config
