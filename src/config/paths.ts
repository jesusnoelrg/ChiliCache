import fs from 'fs';
import path from 'path';

export const DATA_DIR = path.resolve(
  process.env.DATA_DIR || path.join(process.cwd(), 'data')
);

export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const COMPANY_UPLOADS_DIR = path.join(UPLOADS_DIR, 'company');
export const DB_PATH = path.join(DATA_DIR, 'database.db');
export const DEFAULT_LOGO_PATH = '/images/default-logo.svg';

export function normalizePublicPath(filePath: string | null | undefined): string {
  if (!filePath?.trim()) return DEFAULT_LOGO_PATH;

  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function ensureDataDirs(): void {
  fs.mkdirSync(COMPANY_UPLOADS_DIR, { recursive: true });
}
