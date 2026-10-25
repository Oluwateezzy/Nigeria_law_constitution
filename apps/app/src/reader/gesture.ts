import { swipeDelta } from '@nigeria-law/domain';
import { PanResponder } from 'react-native';
import { isSheetOpen } from '@/reader/sheet';

let onSwipe: (delta: -1 | 1) => void = () => undefined;

export function setSwipeHandler(handler: (delta: -1 | 1) => void): () => void {
  onSwipe = handler;
  return () => {
    if (onSwipe === handler) {
      onSwipe = () => undefined;
    }
  };
}

export const readerPan = PanResponder.create({
  onMoveShouldSetPanResponder: (_event, gesture) => {
    if (isSheetOpen()) {
      return false;
    }
    return (
      Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy)
    );
  },
  onPanResponderRelease: (_event, gesture) => {
    const delta = swipeDelta(gesture.dx, isSheetOpen());
    if (delta) {
      onSwipe(delta);
    }
  },
});
