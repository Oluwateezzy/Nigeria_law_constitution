import { LegalScreen } from '@/legal/LegalScreen';
import { termsParagraphs } from '@/legal/documents';
import { copy } from '@/copy';

export default function TermsScreen() {
  return (
    <LegalScreen title={copy.settings.terms} paragraphs={termsParagraphs} />
  );
}
