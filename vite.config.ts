import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              return 'vendor-libs';
            }
            if (id.includes('flutterSourceCode') || id.includes('FlutterCodeViewer')) {
              return 'chunk-flutter-code';
            }
            if (id.includes('FlutterMobileSimulator')) {
              return 'chunk-flutter-simulator';
            }
            if (
              id.includes('EscrowBookingModal') ||
              id.includes('HandshakeOtpModal') ||
              id.includes('PostJobModal') ||
              id.includes('LiveFaceCaptureModal') ||
              id.includes('WorkerDetailModal')
            ) {
              return 'chunk-modals';
            }
            if (
              id.includes('VerificationQueue') ||
              id.includes('DisputesAuditView') ||
              id.includes('PaymentsEscrowView')
            ) {
              return 'chunk-admin-flow';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/flutter_client/**', '**/backend/**']
      },
    },
  };
});
