import { ScrollView, Text, View } from 'react-native';
import type { ProvisionLine } from '@/reader/provision-lines';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { TextSizeStep } from '@/persistence/database';

type ProvisionBodyProps = {
  lines: readonly ProvisionLine[];
  textSize: TextSizeStep;
  onLineLayout: (anchor: string, y: number) => void;
};

export function ProvisionBody({
  lines,
  textSize,
  onLineLayout,
}: ProvisionBodyProps) {
  const { colors } = useTheme();
  const provision = {
    ...typeScale.provision,
    ...typeScale.provisionSteps[textSize],
  };
  return (
    <View style={{ gap: space.unit * 3 }}>
      {lines.map((line) =>
        line.kind === 'table' ? (
          <ScrollView
            key={line.anchor}
            horizontal
            nestedScrollEnabled
            onLayout={(event) =>
              onLineLayout(line.anchor, event.nativeEvent.layout.y)
            }
            style={{
              width: '100%',
              marginLeft: line.depth * space.unit * 4,
            }}
          >
            <View>
              {(line.rows ?? []).map((row, rowIndex) => (
                <View
                  key={`${line.anchor}-${rowIndex}`}
                  style={{ flexDirection: 'row' }}
                >
                  {row.map((cell, cellIndex) => (
                    <Text
                      key={`${line.anchor}-${rowIndex}-${cellIndex}`}
                      selectable
                      style={{
                        minWidth: 160,
                        padding: space.unit * 2,
                        borderWidth: 1,
                        borderColor: colors.line,
                        color: colors.ink,
                        fontFamily: provision.fontFamily,
                        fontSize: provision.fontSize,
                        lineHeight: provision.lineHeight,
                      }}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View
            key={line.anchor}
            onLayout={(event) =>
              onLineLayout(line.anchor, event.nativeEvent.layout.y)
            }
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingLeft: line.depth * space.unit * 4,
            }}
          >
            {line.marker ? (
              <Text
                selectable
                style={{
                  minWidth: 48,
                  marginRight: space.unit * 2,
                  color: colors.ink,
                  fontFamily: provision.fontFamily,
                  fontSize: provision.fontSize,
                  lineHeight: provision.lineHeight,
                }}
              >
                {line.marker}
              </Text>
            ) : null}
            <Text
              selectable
              style={{
                flex: 1,
                color: colors.ink,
                fontFamily: provision.fontFamily,
                fontSize: provision.fontSize,
                lineHeight: provision.lineHeight,
              }}
            >
              {line.text}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}
