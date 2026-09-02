import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: true,
    port: 3000,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const decodedUrl = decodeURIComponent(req.url);
        const staticFolders = ['/part1/', '/part2/', '/part3/', '/clients/', '/ai post/', '/all work/'];
        const isStatic = staticFolders.some(f => decodedUrl.startsWith(f));

        if (isStatic) {
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
        next();
      });
    }
  },
  plugins: [
    {
      name: 'copy-root-assets-to-dist',
      closeBundle() {
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) return;

        const foldersToCopy = ['part1', 'part2', 'part3', 'clients', 'all work', 'ai post'];
        foldersToCopy.forEach(folder => {
          const srcPath = path.join(__dirname, folder);
          const destPath = path.join(distDir, folder);
          if (fs.existsSync(srcPath)) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          }
        });

        // Copy hero profile image if present
        const heroImg = 'MD_ Tanvir Hasan Rudro Maruf – Creative Web Designer Portfolio.jfif';
        const srcImg = path.join(__dirname, heroImg);
        const destImg = path.join(distDir, heroImg);
        if (fs.existsSync(srcImg)) {
          fs.copyFileSync(srcImg, destImg);
        }
      }
    }
  ]
});

