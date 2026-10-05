import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Mount React immediately for instant startup performance
createRoot(document.getElementById('root')!).render(<App />);

// Register PWA service worker asynchronously only in browser environments (skip inside desktop Tauri)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !(window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
  try {
    registerSW({ immediate: false });
  } catch {
    // Desktop or offline fallback
  }
}
