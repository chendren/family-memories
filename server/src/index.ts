import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { createServer } from 'node:http';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { initDb, closeDb } from './db/sqlite.js';
import { initLanceDb, closeLanceDb } from './db/lance.js';
import { initCache, closeRedis } from './services/cache.js';
import { startPolling, stopPolling } from './jobs/queue.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { setupWebSocket, closeWebSocket } from './routes/ws.js';
import { familyGraph } from './services/family-graph.js';
import { processThumbnailJob } from './jobs/processors/thumbnail.js';
import { processEmbedJob } from './jobs/processors/embed.js';
import { processSummarizeJob } from './jobs/processors/summarize.js';
import { processExtractJob } from './jobs/processors/extract.js';
import { processConnectionsJob } from './jobs/processors/connections.js';
import healthRouter from './routes/health.js';
import memoriesRouter from './routes/memories.js';
import captureRouter from './routes/capture.js';
import familyRouter from './routes/family.js';
import searchRouter from './routes/search.js';
import timelineRouter from './routes/timeline.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3142'] }));
app.use(apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(requestId);

app.use('/media', express.static(path.join(config.DATA_DIR, 'media')));

app.use('/api', healthRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/capture', captureRouter);
app.use('/api/family', familyRouter);
app.use('/api/search', searchRouter);
app.use('/api/timeline', timelineRouter);

app.use(errorHandler);

async function start(): Promise<void> {
  const db = initDb();
  familyGraph.hydrateFromDb(db);
  await initLanceDb();
  initCache();

  const server = createServer(app);
  setupWebSocket(server);

  startPolling({
    thumbnail: processThumbnailJob,
    embed: processEmbedJob,
    summarize: processSummarizeJob,
    extract: processExtractJob,
    connections: processConnectionsJob,
  });

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, dataDir: config.DATA_DIR }, 'Family Memories server started');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    stopPolling();
    closeWebSocket();
    server.close(() => {
      logger.info('HTTP server closed');
    });
    closeDb();
    await closeLanceDb();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
