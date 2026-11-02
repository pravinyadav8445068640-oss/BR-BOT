import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/routes.ts';
import { startBackgroundWorker } from './server/worker.ts';
import { loadDatabase } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Security & parsing middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize DB on boot
  loadDatabase();

  // Start 24/7 Background Strategy Engine
  startBackgroundWorker();

  // Mount API Router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'BR BOT Trading Engine', timestamp: new Date().toISOString() });
  });

  // Setup Vite in Dev or Static files in Production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[BR BOT Server Error]:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[BR BOT] Full-stack Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[BR BOT] Mode: ${isProduction ? 'Production' : 'Development with Vite middleware'}`);
  });
}

createServer().catch((err) => {
  console.error('[BR BOT Startup Failure]:', err);
  process.exit(1);
});
