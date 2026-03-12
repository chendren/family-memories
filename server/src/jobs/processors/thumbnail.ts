import type { Job } from '../queue.js';
import { getDb } from '../../db/sqlite.js';
import { generateThumbnail, extractExifData } from '../../services/media.js';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { broadcast } from '../../routes/ws.js';
import path from 'node:path';

interface MediaAssetRow {
  id: string;
  memory_id: string;
  file_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  original_name: string | null;
  created_at: string;
}

interface MemoryRow {
  memory_date: string | null;
}

export async function processThumbnailJob(job: Job): Promise<void> {
  const db = getDb();

  const asset = db.prepare(
    'SELECT * FROM media_assets WHERE memory_id = ? LIMIT 1',
  ).get(job.memory_id) as MediaAssetRow | undefined;

  if (!asset) {
    logger.warn({ memoryId: job.memory_id }, 'No media asset found for thumbnail job');
    return;
  }

  // file_path stored as "media/originals/{id}/{file}" — absolute = DATA_DIR + file_path
  const absolutePath = path.join(config.DATA_DIR, asset.file_path);

  // Only generate thumbnails for images
  if (!asset.mime_type.startsWith('image/')) {
    logger.info({ memoryId: job.memory_id, mimeType: asset.mime_type }, 'Skipping thumbnail for non-image');
    return;
  }

  // Broadcast that processing has started
  broadcast('memory:processing', {
    id: job.memory_id,
    status: 'processing',
    job_type: 'thumbnail',
  });

  // Generate thumbnail
  const thumbnailPath = await generateThumbnail(absolutePath, job.memory_id);
  logger.info({ memoryId: job.memory_id, thumbnailPath }, 'Thumbnail generated');

  // Update media_assets with thumbnail path
  db.prepare('UPDATE media_assets SET thumbnail_path = ? WHERE id = ?').run(
    thumbnailPath,
    asset.id,
  );

  // Extract EXIF data and update dimensions
  const exif = await extractExifData(absolutePath);

  if (exif.width && exif.height) {
    db.prepare('UPDATE media_assets SET width = ?, height = ? WHERE id = ?').run(
      exif.width,
      exif.height,
      asset.id,
    );
  }

  // If EXIF has a date and memory doesn't have one, update it
  if (exif.dateTaken) {
    const memory = db.prepare(
      'SELECT memory_date FROM memories WHERE id = ?',
    ).get(job.memory_id) as MemoryRow | undefined;

    if (memory && !memory.memory_date) {
      db.prepare('UPDATE memories SET memory_date = ? WHERE id = ?').run(
        exif.dateTaken,
        job.memory_id,
      );
    }
  }

  // Store GPS data in memory metadata if available
  if (exif.gps) {
    const metadataJson = JSON.stringify({ gps: exif.gps });
    db.prepare(
      'UPDATE memories SET metadata = ? WHERE id = ? AND metadata IS NULL',
    ).run(metadataJson, job.memory_id);
  }

  broadcast('memory:updated', {
    id: job.memory_id,
    thumbnail_path: thumbnailPath,
    job_type: 'thumbnail',
  });
}
