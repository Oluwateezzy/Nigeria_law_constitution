import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { copy } from '@/copy';

export async function shareNotesMarkdown(markdown: string): Promise<void> {
  if (cacheDirectory && (await isAvailableAsync())) {
    const uri = `${cacheDirectory}notes.md`;
    await writeAsStringAsync(uri, markdown);
    await shareAsync(uri, {
      mimeType: 'text/markdown',
      UTI: 'net.daringfireball.markdown',
      dialogTitle: copy.settings.exportNotes,
    });
    return;
  }
  downloadNotesMarkdown(markdown);
}

function downloadNotesMarkdown(markdown: string): void {
  const document = globalThis.document;
  if (!document) return;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'notes.md';
  link.click();
  URL.revokeObjectURL(url);
}
