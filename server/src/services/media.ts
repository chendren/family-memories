import sharp from 'sharp';
import path from 'node:path';
import { mkdirSync, statSync } from 'node:fs';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export async function generateThumbnail(inputPath: string, memoryId: string): Promise<string> {
  const thumbnailDir = path.join(config.DATA_DIR, 'media', 'thumbnails', memoryId);
  mkdirSync(thumbnailDir, { recursive: true });

  const ext = 'webp';
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const filename = baseName + '.' + ext;
  const outputPath = path.join(thumbnailDir, filename);

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toFile(outputPath);

  logger.debug({ memoryId, outputPath }, 'Thumbnail generated');

  // Return relative path (from media/ root) for DB storage and HTTP serving
  return path.join('thumbnails', memoryId, filename);
}

export async function extractExifData(inputPath: string): Promise<{
  dateTaken: string | null;
  width: number | null;
  height: number | null;
  gps: { lat: number; lon: number } | null;
}> {
  try {
    const metadata = await sharp(inputPath).metadata();

    // sharp doesn't parse EXIF date fields directly, so fall back to file mtime
    let dateTaken: string | null = null;
    try {
      const stat = statSync(inputPath);
      if (stat.mtime) {
        dateTaken = stat.mtime.toISOString();
      }
    } catch {
      // stat failed, leave null
    }

    // Parse GPS from EXIF buffer if present
    let gps: { lat: number; lon: number } | null = null;
    if (metadata.exif) {
      gps = parseGpsFromExif(metadata.exif);
    }

    return {
      dateTaken,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      gps,
    };
  } catch (err) {
    logger.warn({ err, inputPath }, 'Failed to extract EXIF data');
    return { dateTaken: null, width: null, height: null, gps: null };
  }
}

function parseGpsFromExif(exifBuffer: Buffer): { lat: number; lon: number } | null {
  // EXIF GPS data lives in IFD GPS sub-IFD. Parsing raw EXIF is complex,
  // so we look for the GPS IFD tag marker (0x8825) and extract coordinates.
  // For robustness without a full EXIF parser or regex, we use a simple
  // byte-scanning approach for the GPS rational values.

  // Check if the buffer has enough data to contain GPS info
  if (exifBuffer.length < 100) return null;

  // Look for GPS latitude and longitude markers in the EXIF data
  // GPS IFD tags: 0x0001 (LatRef), 0x0002 (Lat), 0x0003 (LonRef), 0x0004 (Lon)
  // This is a best-effort extraction; full parsing would need exif-reader
  try {
    const str = exifBuffer.toString('ascii');

    // Check if GPS data appears to be present
    if (!str.includes('GPS')) return null;

    // Without a proper EXIF parser, we can't reliably extract GPS coordinates
    // from raw bytes. Return null and log that GPS data was detected but not parsed.
    logger.debug('GPS data detected in EXIF but full parsing requires exif-reader package');
    return null;
  } catch {
    return null;
  }
}

export async function getImageDimensions(inputPath: string): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(inputPath).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}

export function getMediaType(mimeType: string): 'photo' | 'audio' | 'video' | 'document' | 'text' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || mimeType === 'text/plain') return 'document';
  return 'text';
}
