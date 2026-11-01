import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/copy';
import { readerBarActions } from '@/reader/bar';
import { getGlassStyle } from '@/theme/glass';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const icons = {
  previous: '←',
  ask: '✨',
  note: '📝',
  next: '→',
} as const;

const labels = {
  previous: {
    title: copy.reader.previous,
    label: copy.reader.previousLabel,
  },
  ask: { title: copy.reader.ask, label: copy.reader.askLabel },
  note: { title: copy.reader.note, label: copy.reader.noteLabel },
  next: { title: copy.reader.next, label: copy.reader.nextLabel },
} as const;

type ReaderBarProps = {
  atStart: boolean;
  atEnd: boolean;
  noteFilled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onAsk?: () => void;
  onNote?: () => void;
};

export function ReaderMoves({
  atStart,
  atEnd,
  onPrevious,
  onNext,
}: {
  atStart: boolean;
  atEnd: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <MoveControl id="previous" disabled={atStart} onPress={onPrevious} />
      <MoveControl id="next" disabled={atEnd} onPress={onNext} />
    </View>
  );
}

export function ReaderBar({
  atStart,
  atEnd,
  noteFilled = false,
  onPrevious,
  onNext,
  onAsk,
  onNote,
}: ReaderBarProps) {
  const insets = useSafeAreaInsets();
  const { scheme, colors } = useTheme();
  const glass = getGlassStyle(scheme, { border: true });
  const actions = readerBarActions({ atStart, atEnd });

  return (
    <View
      style={[
        glass,
        styles.bar,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : space.sm,
          borderTopColor: colors.line,
        },
      ]}
    >
      <View style={styles.actionRow}>
        {actions.map((action) => {
          const text = labels[action.id];
          const onPress =
            action.id === 'previous'
              ? onPrevious
              : action.id === 'next'
                ? onNext
                : action.id === 'note'
                  ? onNote
                  : action.id === 'ask'
                    ? onAsk
                    : undefined;
          const label =
            action.id === 'note' && noteFilled
              ? copy.reader.noteSavedLabel
              : text.label;
          return (
            <MoveControl
              key={action.id}
              id={action.id}
              label={label}
              disabled={action.disabled}
              noteFilled={action.id === 'note' && noteFilled}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function MoveControl({
  id,
  label,
  disabled = false,
  noteFilled = false,
  onPress,
}: {
  id: keyof typeof labels;
  label?: string;
  disabled?: boolean;
  noteFilled?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const text = labels[id];
  const icon = icons[id];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? text.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          opacity: disabled ? 0.35 : 1,
          backgroundColor: pressed ? colors.primarySoft : 'transparent',
        },
      ]}
    >
      <View style={styles.buttonContent}>
        <Text style={{ fontSize: 14, color: colors.primary }}>
          {icon}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: colors.ink,
            fontFamily: fonts.interMedium,
            fontSize: typeScale.body.fontSize - 1, // 14px
            lineHeight: 18,
            fontWeight: '500',
          }}
        >
          {text.title}
        </Text>
        {noteFilled ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 7,
              height: 7,
              borderRadius: radius.full,
              backgroundColor: colors.primary,
            }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingTop: space.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
    minHeight: space.target,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
    borderRadius: radius.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
