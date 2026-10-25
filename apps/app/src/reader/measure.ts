import { Platform, type DimensionValue } from 'react-native';
import { measureCh } from '@/theme/tokens';

export function columnMaxWidth(fontSize: number): DimensionValue {
  if (Platform.OS === 'web') {
    return '68ch' as DimensionValue;
  }
  return Math.round(measureCh * fontSize * 0.5);
}
