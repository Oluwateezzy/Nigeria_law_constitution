import { router } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function LegalScreen({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  const { colors } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={title}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/settings');
        }}
      />
      <ScrollView style={{ flex: 1 }}>
        {paragraphs.map((paragraph) => (
          <Text
            key={paragraph}
            style={{
              marginTop: space.unit * 4,
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight * 1.4,
            }}
          >
            {paragraph}
          </Text>
        ))}
      </ScrollView>
    </Screen>
  );
}
