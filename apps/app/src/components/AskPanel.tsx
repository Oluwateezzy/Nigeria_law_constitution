import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { readSupabasePublicConfig } from '@/account/client';
import {
  appendThreadMessage,
  clearThread,
  listThreadMessages,
  livingThread,
  type ThreadMessage,
} from '@/ask/repository';
import { readOwnKey } from '@/ask/keys';
import { quotaLine } from '@/ask/quota-line';
import {
  retrySend,
  sendProvision,
  type AskAnswer,
  type SendResult,
} from '@/ask/send';
import { DisclosurePanel } from '@/components/DisclosurePanel';
import { DisclaimerLine } from '@/components/DisclaimerLine';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { useSearch } from '@/search/SearchProvider';
import { notifyNotesChanged } from '@/sync/bus';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type AskPanelProps = {
  sectionId: string;
  title: string;
  plainText: string;
  path: string;
  citation: string;
  extent: string;
  contentVersion: string;
  modal: boolean;
  onClose: () => void;
};

export function AskPanel(props: AskPanelProps) {
  const body = <AskBody key={props.sectionId} {...props} />;
  if (!props.modal) {
    return (
      <View style={{ width: 360, flex: 1, paddingHorizontal: space.screen }}>
        {body}
      </View>
    );
  }
  return (
    <Modal
      animationType="slide"
      transparent={false}
      onRequestClose={props.onClose}
    >
      <View style={{ flex: 1 }}>{body}</View>
    </Modal>
  );
}

function AskBody({
  sectionId,
  title,
  plainText,
  path,
  citation,
  extent,
  contentVersion,
  onClose,
}: AskPanelProps) {
  const { colors } = useTheme();
  const preferences = usePreferences();
  const account = useAccount();
  const { database } = useSearch();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ownKey, setOwnKey] = useState(false);
  const [failedKey, setFailedKey] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [serverVersion, setServerVersion] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const db = database();
    if (!db) return;
    let cancelled = false;
    void livingThread(db, sectionId).then(async (thread) => {
      if (cancelled || !thread) {
        if (!cancelled) setMessages([]);
        return;
      }
      const rows = await listThreadMessages(db, thread.id);
      if (!cancelled) setMessages(rows);
    });
    void readOwnKey().then((key) => {
      if (!cancelled) setOwnKey(Boolean(key));
    });
    return () => {
      cancelled = true;
    };
  }, [database, sectionId]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!preferences.disclosureAccepted) return;
    setBusy(true);
    setStatus(null);
    setFailedKey(false);
    const config = readSupabasePublicConfig();
    const key = await readOwnKey();
    const history = [
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: 'user' as const, content: trimmed },
    ];
    const online =
      typeof navigator === 'undefined' || navigator.onLine !== false;
    const attempt = () =>
      sendProvision({
        ownKey: key,
        proxyUrl: config ? `${config.url}/functions/v1/ai` : '',
        http: async (request) => {
          const headers = { ...request.headers };
          if (config && request.url.startsWith(config.url)) {
            headers.apikey = config.anonKey;
            headers.Authorization = account.accessToken
              ? `Bearer ${account.accessToken}`
              : `Bearer ${config.anonKey}`;
          }
          const response = await fetch(request.url, {
            method: request.method,
            headers,
            body: request.body,
          });
          return { status: response.status, body: await response.text() };
        },
        section: { id: sectionId, plainText, path, citation, extent },
        messages: history,
        disclosed: preferences.disclosureAccepted,
        online,
        remaining: preferences.quota.remaining,
        installId: preferences.installId,
        contentVersion,
      });
    const previous: SendResult = { kind: 'provider' };
    let result: SendResult;
    try {
      result =
        pending === trimmed
          ? await retrySend(previous, attempt)
          : await attempt();
    } catch {
      setBusy(false);
      setPending(trimmed);
      if (key) setFailedKey(true);
      setStatus(key ? copy.ask.badKey : copy.ask.providerError);
      return;
    }
    setBusy(false);
    if (result.kind === 'offline') {
      setPending(null);
      setStatus(copy.offlineAi);
      return;
    }
    if (result.kind === 'quota') {
      setPending(null);
      preferences.rememberQuota(
        result.quota ?? { ...preferences.quota, remaining: 0 },
      );
      return;
    }
    if (result.kind === 'provider') {
      setPending(trimmed);
      if (key) setFailedKey(true);
      setStatus(key ? copy.ask.badKey : copy.ask.providerError);
      return;
    }
    setPending(null);
    if (result.kind !== 'answer') return;
    setServerVersion(
      Boolean(result.contentVersion) &&
        result.contentVersion !== contentVersion,
    );
    const now = new Date().toISOString();
    const db = database();
    if (db) {
      await appendThreadMessage(db, {
        sectionId,
        title,
        role: 'user',
        content: trimmed,
        now,
      });
      const saved = await appendThreadMessage(db, {
        sectionId,
        title,
        role: 'assistant',
        content: result.answer.content,
        citations: result.answer.citations,
        illustration: result.answer.illustration,
        limits: result.answer.limits,
        now,
      });
      const thread = await livingThread(db, sectionId);
      if (thread) setMessages(await listThreadMessages(db, thread.id));
      else setMessages((current) => [...current, saved]);
      notifyNotesChanged();
    }
    if (result.quota) preferences.rememberQuota(result.quota);
    else if (result.counted) {
      preferences.rememberQuota({
        ...preferences.quota,
        remaining: Math.max(0, preferences.quota.remaining - 1),
      });
    }
    setDraft('');
  }

  const spent = !ownKey && preferences.quota.remaining <= 0;
  const starters = [copy.ask.explain, copy.ask.illustration, copy.ask.limits];

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg, padding: space.screen }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.settings.close}
        onPress={onClose}
        style={{ minHeight: space.target, justifyContent: 'center' }}
      >
        <Text style={{ color: colors.accent }}>{copy.settings.close}</Text>
      </Pressable>
      <Text
        accessibilityRole="header"
        style={{
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {title}
      </Text>
      <View style={{ marginTop: space.unit * 3 }}>
        <DisclaimerLine />
      </View>
      <ScrollView style={{ flex: 1 }}>
        {!preferences.disclosureAccepted ? (
          <DisclosurePanel onContinue={preferences.acceptDisclosure} />
        ) : null}
        {preferences.disclosureAccepted
          ? starters.map((starter) => (
              <Pressable
                key={starter}
                accessibilityRole="button"
                accessibilityLabel={starter}
                onPress={() => {
                  void ask(starter);
                }}
                style={{ minHeight: space.target, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.accent }}>{starter}</Text>
              </Pressable>
            ))
          : null}
        {messages.map((message) => (
          <MessageView key={message.id} message={message} />
        ))}
        {status ? (
          <Text
            style={{
              marginTop: space.unit * 3,
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {status}
          </Text>
        ) : null}
        {status === copy.ask.providerError && pending ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.retry}
            onPress={() => {
              void ask(pending);
            }}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>{copy.ask.retry}</Text>
          </Pressable>
        ) : null}
        {serverVersion ? (
          <Text
            style={{
              marginTop: space.unit * 3,
              color: colors.inkMuted,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.ask.serverVersion}
          </Text>
        ) : null}
        {failedKey ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.openSettings}
            onPress={() => router.push('/settings/ai')}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>
              {copy.ask.openSettings}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <Text
        style={{
          marginTop: space.unit * 3,
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {ownKey ? copy.ownKeyActive : quotaLine(preferences.quota.remaining)}
      </Text>
      {spent ? (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.subscribe}
            onPress={() => router.push('/settings/plus')}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>{copy.ask.subscribe}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.ownKey}
            onPress={() => router.push('/settings/ai')}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>{copy.ask.ownKey}</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.unit * 2,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={preferences.disclosureAccepted}
            placeholder={copy.askPlaceholder}
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel={copy.askPlaceholder}
            style={{
              flex: 1,
              minHeight: space.target,
              color: colors.ink,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.field,
              paddingHorizontal: space.unit * 3,
              backgroundColor: colors.bgRaised,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.send}
            disabled={!preferences.disclosureAccepted}
            onPress={() => {
              void ask(draft);
            }}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>{copy.ask.send}</Text>
          </Pressable>
        </View>
      )}
      {confirmClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ask.clear}
          onPress={() => {
            const db = database();
            if (!db) return;
            void clearThread(db, sectionId, new Date().toISOString()).then(
              () => {
                setMessages([]);
                setConfirmClear(false);
                notifyNotesChanged();
              },
            );
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.ink }}>{copy.ask.clearConfirm}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ask.clear}
          onPress={() => setConfirmClear(true)}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.inkMuted }}>{copy.ask.clear}</Text>
        </Pressable>
      )}
    </View>
  );
}

function MessageView({ message }: { message: ThreadMessage }) {
  const { colors } = useTheme();
  const answer: AskAnswer = {
    content: message.content,
    illustration: message.illustration,
    limits: message.limits,
    citations: message.citations ?? [],
  };
  return (
    <View style={{ marginTop: space.unit * 4 }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {answer.content}
      </Text>
      {answer.illustration ? (
        <Text
          style={{
            marginTop: space.unit * 2,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.ask.illustrationLabel}. {answer.illustration}
        </Text>
      ) : null}
      {answer.limits.map((limit) => (
        <Text
          key={limit}
          style={{
            marginTop: space.unit * 2,
            color: colors.inkMuted,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {limit}
        </Text>
      ))}
      {answer.citations.map((citation) => (
        <Text
          key={`${citation.sectionId}:${citation.quote}`}
          style={{
            marginTop: space.unit * 2,
            color: colors.inkMuted,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {citation.quote}
        </Text>
      ))}
    </View>
  );
}
