import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

/**
 * S3-compatible object storage (Cloudeka, not AWS itself) shared by every
 * upload endpoint. Configure via AWS_S3_* env vars - see .env.example.
 */
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const bucket = process.env.AWS_S3_BUCKET || '';

/**
 * Multer storage engine that uploads directly to S3 under
 * `wargahub/<folder>/<uuid>.<ext>`. The `wargahub/` prefix keeps this app's
 * files separated from other apps that may share the same bucket. The
 * resulting `file.location` (set by multer-s3) is the public URL to store.
 */
export function s3Storage(folder: string) {
  return multerS3({
    s3: s3Client as any,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const uniqueName = `wargahub/${folder}/${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}
