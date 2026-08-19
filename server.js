import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function createServer() {
  const app = express();
  let vite;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import('compression')).default;
    const serveStatic = (await import('serve-static')).default;
    app.use(compression());
    app.use(serveStatic(path.resolve(__dirname, 'dist/client'), { index: false }));
  }

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template;
      let render;

      if (!isProduction) {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
      } else {
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
      }

      // The app is hash-routed (e.g. /#/admin), so the URL that reaches this
      // server is always "/" and per-page titles can never be derived here.
      // Page titles and meta are updated client-side from the hash (src/App.tsx);
      // the shell below only carries the default title for first paint.
      let title = "Faith & Fire Ministries — Word of Faith, Holiness & Holy Spirit Power";
      let metaDescription = "Experience transformation at Faith & Fire Ministries. Join our vibrant worship services, ministries, and community.";

      const html = template
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${metaDescription}" />`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} (${isProduction ? 'Production SSR' : 'Vite SSR Dev'})`);
  });
}

createServer();
