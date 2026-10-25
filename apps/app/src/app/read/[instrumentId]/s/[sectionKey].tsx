import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function ReaderScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    instrumentId: string;
    sectionKey: string;
  }>();
  const sectionKey = firstParam(params.sectionKey);
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.reader.empty}
        actionLabel="Close"
        onAction={() => router.back()}
      />
      <Text
        style={{
          marginTop: 24,
          color: colors.accent,
          fontFamily: typeScale.sectionNumber.fontFamily,
          fontSize: typeScale.sectionNumber.fontSize,
          lineHeight: typeScale.sectionNumber.lineHeight,
        }}
      >
        {sectionKey}
      </Text>
    </Screen>
  );
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}
