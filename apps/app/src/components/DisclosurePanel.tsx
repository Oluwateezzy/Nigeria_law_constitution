import { Pressable, Text, View } from 'react-native';
import { copy } from '@/copy';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const lines = [
  copy.disclosure.notLegalAdvice,
  copy.disclosure.sentToProvider,
  copy.disclosure.hostedOrOwnKey,
  copy.disclosure.freeLane,
];

export function DisclosurePanel({ onContinue }: { onContinue: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: space.unit * 4 }}>
      {lines.map((line) => (
        <Text
          key={line}
          style={{
            marginTop: space.unit * 3,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {line}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.disclosure.continue}
        onPress={onContinue}
        style={{ minHeight: space.target, justifyContent: 'center' }}
      >
        <Text style={{ color: colors.accent }}>{copy.disclosure.continue}</Text>
      </Pressable>
    </View>
  );
}
