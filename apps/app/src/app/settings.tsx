import { router } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { colors } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.settings.title}
        actionLabel={copy.settings.close}
        onAction={() => router.back()}
      />
      <Text
        style={{
          marginTop: 24,
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {copy.settings.body}
      </Text>
    </Screen>
  );
}
