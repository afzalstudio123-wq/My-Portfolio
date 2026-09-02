import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: __dirname,
  server: {
    host: true,
    port: 3000,
    watch: {
      ignored: [
        '**/frames/**',
        '**/wedding digtal cards/**',
        '**/all work/**',
        '**/ai post/**',
        '**/clients/**',
        '**/dist/**'
      ]
    }
  },
  plugins: [
    {
      name: 'serve-local-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const decodedUrl = decodeURIComponent(req.url);

          // Handle static asset requests for frames, clients, ai post, wedding cards, all work
          const staticFolders = ['/frames/', '/clients/', '/ai post/', '/wedding digtal cards/', '/all work/'];
          const isStaticFolder = staticFolders.some(folder => decodedUrl.startsWith(folder));

          if (isStaticFolder) {
            const filePath = path.join(__dirname, decodedUrl);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes = {
                '.mp4': 'video/mp4',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.jfif': 'image/jpeg'
              };
              if (mimeTypes[ext]) {
                res.setHeader('Content-Type', mimeTypes[ext]);
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                return fs.createReadStream(filePath).pipe(res);
              }
            }
          }

          // Serve hero profile image
          if (req.url.includes('Creative Web Designer Portfolio.jfif') || req.url.endsWith('.jfif')) {
            const imgPath = path.join(__dirname, 'MD_ Tanvir Hasan Rudro Maruf - Creative Web Designer Portfolio.jfif');
            if (fs.existsSync(imgPath)) {
              res.setHeader('Content-Type', 'image/jpeg');
              return fs.createReadStream(imgPath).pipe(res);
            }
          }
          next();
        });
      }
    }
  ]
});
