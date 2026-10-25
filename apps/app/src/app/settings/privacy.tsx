import { LegalScreen } from '@/legal/LegalScreen';
import { privacyParagraphs } from '@/legal/documents';
import { copy } from '@/copy';

export default function PrivacyScreen() {
  return (
    <LegalScreen title={copy.settings.privacy} paragraphs={privacyParagraphs} />
  );
}
