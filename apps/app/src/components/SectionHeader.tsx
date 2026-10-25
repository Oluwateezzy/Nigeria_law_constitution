import { Text, View } from 'react-native';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type SectionHeaderProps = {
  path: string;
  number: string;
  heading?: string;
};

export function SectionHeader({ path, number, heading }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: space.unit * 4 }}>
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
          textTransform: 'uppercase',
        }}
      >
        {path}
      </Text>
      <Text
        style={{
          marginTop: space.unit * 3,
          color: colors.accent,
          fontFamily: typeScale.sectionNumber.fontFamily,
          fontSize: typeScale.sectionNumber.fontSize,
          lineHeight: typeScale.sectionNumber.lineHeight,
        }}
      >
        {number}
      </Text>
      {heading ? (
        <Text
          accessibilityRole="header"
          style={{
            marginTop: space.unit * 2,
            color: colors.ink,
            fontSize: typeScale.heading.fontSize,
            lineHeight: typeScale.heading.lineHeight,
          }}
        >
          {heading}
        </Text>
      ) : null}
    </View>
  );
}
