import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes the CSV to the cache directory and opens the system share sheet. */
export async function shareCsv(fileName: string, body: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(body);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is unavailable on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'LedgerFlow export',
    UTI: 'public.comma-separated-values-text',
  });
}
