import { Image, Pressable, Text, View } from 'react-native';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type TopBarProps = {
  title?: string;
  showBrandMark?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  heading?: boolean;
};

export function TopBar({
  title,
  showBrandMark = false,
  actionLabel,
  onAction,
  heading = true,
}: TopBarProps) {
  const { scheme, colors } = useTheme();

  return (
    <View
      style={{
        minHeight: space.target,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.sm,
        paddingTop: space.sm,
        paddingBottom: space.xs,
      }}
    >
      {showBrandMark ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Image
            source={
              scheme === 'dark'
                ? require('../../assets/brand/logo-mono-dark@2x.png')
                : require('../../assets/brand/logo@2x.png')
            }
            style={{ width: 32, height: 32, borderRadius: radius.sm }}
            accessibilityLabel="What Does The Law Say emblem"
          />
          <Image
            source={
              scheme === 'dark'
                ? require('../../assets/brand/wordmark-dark@2x.png')
                : require('../../assets/brand/wordmark@2x.png')
            }
            style={{ width: 160, height: 36, resizeMode: 'contain' }}
            accessibilityLabel="What Does The Law Say"
          />
        </View>
      ) : (
        <Text
          accessibilityRole={heading ? 'header' : undefined}
          style={{
            flex: 1,
            color: colors.ink,
            fontFamily: fonts.interSemi,
            fontSize: typeScale.h2.fontSize,
            lineHeight: typeScale.h2.lineHeight,
            fontWeight: '600',
          }}
        >
          {title}
        </Text>
      )}

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => ({
            minHeight: space.target,
            minWidth: space.target,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.sm,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.primarySoft : 'transparent',
          })}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: fonts.interMedium,
              fontSize: typeScale.body.fontSize,
              lineHeight: typeScale.body.lineHeight,
              fontWeight: '500',
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
