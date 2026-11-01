import { elapsedNow } from '@nigeria-law/domain';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { setSheetOpen } from '@/reader/sheet';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { shouldAutosave } from '@/notes/repository';

type NoteSheetProps = {
  noteId: string | null;
  initialBody: string;
  onCommit: (id: string | null, body: string) => Promise<string | null>;
  onDismiss: (id: string | null, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function NoteSheet({
  noteId,
  initialBody,
  onCommit,
  onDismiss,
  onDelete,
}: NoteSheetProps) {
  const { colors, motionDuration } = useTheme();
  const [body, setBody] = useState(initialBody);
  const [savedId, setSavedId] = useState(noteId);
  const [confirming, setConfirming] = useState(false);
  const bodyRef = useRef(initialBody);
  const idRef = useRef(noteId);
  const lastWriteAt = useRef(0);
  const closing = useRef(false);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    setSheetOpen(true);
    lastWriteAt.current = elapsedNow();
    const focus = setTimeout(() => input.current?.focus(), 50);
    const timer = setInterval(() => {
      const now = elapsedNow();
      if (!shouldAutosave(lastWriteAt.current, now)) return;
      const current = bodyRef.current;
      if (current.trim().length === 0) return;
      lastWriteAt.current = now;
      void onCommit(idRef.current, current).then((nextId) => {
        if (!nextId) return;
        idRef.current = nextId;
        setSavedId(nextId);
      });
    }, 1000);
    return () => {
      clearTimeout(focus);
      clearInterval(timer);
      setSheetOpen(false);
    };
  }, [onCommit]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    await onDismiss(idRef.current, bodyRef.current);
  }

  return (
    <Modal
      visible
      animationType={motionDuration('sheet') === 0 ? 'none' : 'slide'}
      onRequestClose={() => {
        void close();
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, paddingHorizontal: space.screen }}
        >
          <TopBar
            title={copy.notes.field}
            actionLabel={copy.notes.done}
            onAction={() => {
              void close();
            }}
          />
          {confirming && savedId ? (
            <View style={{ marginTop: space.lg, padding: space.md, backgroundColor: colors.bgRaised, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.ink,
                  fontFamily: fonts.interSemi,
                  fontSize: typeScale.h2.fontSize,
                  lineHeight: typeScale.h2.lineHeight,
                  fontWeight: '600',
                }}
              >
                {copy.notes.deleteTitle}
              </Text>
              <Text
                style={{
                  marginTop: space.sm,
                  color: colors.inkMuted,
                  fontFamily: fonts.inter,
                  fontSize: typeScale.body.fontSize,
                  lineHeight: typeScale.body.lineHeight,
                }}
              >
                {copy.notes.deleteBody}
              </Text>
              <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.md }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.notes.keep}
                  onPress={() => setConfirming(false)}
                  style={{
                    minHeight: space.target,
                    justifyContent: 'center',
                    paddingHorizontal: space.md,
                    borderRadius: radius.md,
                    backgroundColor: colors.primarySoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: fonts.interSemi,
                      fontSize: typeScale.body.fontSize,
                      lineHeight: typeScale.body.lineHeight,
                    }}
                  >
                    {copy.notes.keep}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.notes.delete}
                  onPress={() => {
                    if (savedId) void onDelete(savedId);
                  }}
                  style={{
                    minHeight: space.target,
                    justifyContent: 'center',
                    paddingHorizontal: space.md,
                    borderRadius: radius.md,
                    backgroundColor: colors.dangerSoft,
                  }}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontFamily: fonts.interSemi,
                      fontSize: typeScale.body.fontSize,
                      lineHeight: typeScale.body.lineHeight,
                    }}
                  >
                    {copy.notes.delete}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {savedId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.notes.delete}
                  onPress={() => setConfirming(true)}
                  style={{
                    minHeight: space.target,
                    justifyContent: 'center',
                    alignSelf: 'flex-start',
                    marginTop: space.xs,
                  }}
                >
                  <Text
                    style={{
                      color: colors.danger,
                      fontFamily: fonts.interMedium,
                      fontSize: typeScale.caption.fontSize,
                      lineHeight: typeScale.caption.lineHeight,
                    }}
                  >
                    {copy.notes.delete}
                  </Text>
                </Pressable>
              ) : null}
              <TextInput
                ref={input}
                autoFocus
                multiline
                value={body}
                onChangeText={(value) => {
                  bodyRef.current = value;
                  setBody(value);
                }}
                accessibilityLabel={copy.notes.field}
                textAlignVertical="top"
                style={{
                  flex: 1,
                  marginTop: space.sm,
                  marginBottom: space.md,
                  color: colors.ink,
                  backgroundColor: colors.bgRaised,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: space.md,
                  fontFamily: fonts.newsreader,
                  fontSize: typeScale.provision.fontSize,
                  lineHeight: typeScale.provision.lineHeight,
                }}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
