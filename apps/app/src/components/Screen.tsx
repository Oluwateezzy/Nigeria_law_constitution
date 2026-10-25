import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edges } from 'react-native-safe-area-context';
import { columnMaxWidth } from '@/reader/measure';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type ScreenProps = {
  children: ReactNode;
  edges?: Edges;
};

export function Screen({ children, edges = ['top'] }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: columnMaxWidth(typeScale.provision.fontSize),
          alignSelf: 'center',
          paddingHorizontal: space.screen,
          paddingBottom: space.unit * 4,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
