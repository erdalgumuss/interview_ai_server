import fs from 'fs/promises';
import path from 'path';

/**
 * Bir veya birden fazla dosya yolunu güvenli şekilde siler.
 * Hata olursa loglar, uygulamanın akışını bozmaz.
 * @param files - string veya string[] olarak dosya yolu(ları)
 */
export async function cleanupTempFiles(files: string | string[]) {
  const fileList = Array.isArray(files) ? files : [files];

  for (const file of fileList) {
    if (!file) continue; // boş string/undefined atla
    try {
      // Dosyanın var olup olmadığını kontrol et
      await fs.access(file);
      await fs.unlink(file);
      console.log(`[cleanupTempFiles] Silindi: ${file}`);
    } catch (err: any) {
      // ENOENT = Dosya yoksa hata verme, sadece logla
      if (err.code !== 'ENOENT') {
        console.error(`[cleanupTempFiles] Silinemedi: ${file}`, err);
      }
    }
  }
}
