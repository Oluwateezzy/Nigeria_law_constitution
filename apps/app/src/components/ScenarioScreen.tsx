import {
  locateSections,
  shippingInstrument,
  shippingInstruments,
} from '@nigeria-law/content';
import { citationRemovedLimit } from '@nigeria-law/domain';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { readSupabasePublicConfig } from '@/account/client';
import { readOwnKey } from '@/ask/keys';
import { quotaLine } from '@/ask/quota-line';
import type { ThreadMessage } from '@/ask/repository';
import { PlusPurchase } from '@/billing/PlusPurchase';
import { CitationCard } from '@/components/CitationCard';
import { DisclaimerLine } from '@/components/DisclaimerLine';
import { DisclosurePanel } from '@/components/DisclosurePanel';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { citationCardRoute, type CardSection } from '@/scenario/cards';
import { retrieveFromIndex } from '@/scenario/fts';
import {
  appendScenarioMessage,
  listScenarioThreads,
  readScenarioMessages,
  scenarioTitle,
  type ScenarioThread,
} from '@/scenario/repository';
import { sendScenario } from '@/scenario/send';
import { useSearch } from '@/search/SearchProvider';
import { notifyNotesChanged } from '@/sync/bus';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function ScenarioScreen() {
  const { colors } = useTheme();
  const preferences = usePreferences();
  const account = useAccount();
  const { database } = useSearch();
  const instrument = shippingInstrument();
  const catalog = useMemo(() => {
    const map = new Map<string, CardSection>();
    for (const item of shippingInstruments()) {
      for (const located of locateSections(item)) {
        map.set(located.section.id, {
          id: located.section.id,
          instrumentId: item.id,
          shortTitle: item.shortTitle,
          number: located.section.number,
          heading: located.section.heading ?? '',
          plainText: located.section.plainText,
          blocks: located.section.blocks,
        });
      }
    }
    return map;
  }, []);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [threads, setThreads] = useState<ScenarioThread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ownKey, setOwnKey] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    const db = database();
    if (!db) return;
    let cancelled = false;
    void listScenarioThreads(db).then((rows) => {
      if (!cancelled) setThreads(rows);
    });
    void readOwnKey().then((key) => {
      if (!cancelled) setOwnKey(Boolean(key));
    });
    return () => {
      cancelled = true;
    };
  }, [database]);

  async function openThread(id: string) {
    const db = database();
    if (!db) return;
    setThreadId(id);
    setMessages(await readScenarioMessages(db, id));
    setDraft('');
    setStatus(null);
  }

  function startNew() {
    setThreadId(null);
    setMessages([]);
    setDraft('');
    setStatus(null);
    setPending(null);
  }

  async function explain(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || !preferences.disclosureAccepted) return;
    const db = database();
    if (!db) return;
    setBusy(true);
    setStatus(null);
    const basis = [
      ...messages
        .filter((message) => message.role === 'user')
        .map((message) => message.content),
      trimmed,
    ].join('\n');
    const retrieval = await retrieveFromIndex(db, basis);
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
    let result;
    try {
      result = await sendScenario({
        facts: basis,
        hits: retrieval.kind === 'sections' ? retrieval.sections : [],
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
        messages: history,
        disclosed: preferences.disclosureAccepted,
        online,
        remaining: preferences.quota.remaining,
        installId: preferences.installId,
        contentVersion: instrument.contentVersion,
        citation: instrument.citation,
      });
    } catch {
      setBusy(false);
      setPending(trimmed);
      setStatus(copy.ask.providerError);
      return;
    }
    setBusy(false);
    if (result.kind === 'weak') {
      setPending(trimmed);
      setStatus(copy.scenario.weak);
      return;
    }
    if (result.kind === 'offline') {
      setStatus(copy.offlineAi);
      return;
    }
    if (result.kind === 'quota') {
      preferences.rememberQuota(
        result.quota ?? { ...preferences.quota, remaining: 0 },
      );
      return;
    }
    if (result.kind === 'provider') {
      setPending(trimmed);
      setStatus(copy.ask.providerError);
      return;
    }
    if (result.kind !== 'answer') return;
    setPending(null);
    const now = new Date().toISOString();
    const title =
      messages.find((message) => message.role === 'user')?.content ?? trimmed;
    const userSaved = await appendScenarioMessage(db, {
      threadId,
      title: scenarioTitle(title),
      role: 'user',
      content: trimmed,
      now,
    });
    await appendScenarioMessage(db, {
      threadId: userSaved.threadId,
      title: scenarioTitle(title),
      role: 'assistant',
      content: result.answer.content,
      citations: result.answer.citations,
      illustration: result.answer.illustration,
      limits: result.answer.limits,
      now,
    });
    setThreadId(userSaved.threadId);
    setMessages(await readScenarioMessages(db, userSaved.threadId));
    setThreads(await listScenarioThreads(db));
    notifyNotesChanged();
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
  const canExplain =
    preferences.disclosureAccepted &&
    draft.trim().length > 0 &&
    !busy &&
    !spent;
  const answered = messages.some((message) => message.role === 'assistant');

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: space.unit * 6 }}
    >
      <Text
        style={{
          marginTop: space.unit * 3,
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {copy.scenario.description}
      </Text>
      {preferences.ready && !preferences.disclosureAccepted ? (
        <DisclosurePanel onContinue={preferences.acceptDisclosure} />
      ) : null}
      {messages.map((message) => (
        <MessageView key={message.id} message={message} catalog={catalog} />
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
      {status === copy.scenario.weak && pending ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.scenario.search}
          onPress={() => {
            router.push(`/?q=${encodeURIComponent(pending)}` as Href);
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.scenario.search}</Text>
        </Pressable>
      ) : null}
      {status === copy.ask.providerError && pending ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ask.retry}
          onPress={() => {
            void explain(pending);
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.ask.retry}</Text>
        </Pressable>
      ) : null}
      <View style={{ marginTop: space.unit * 4 }}>
        <DisclaimerLine />
      </View>
      <Text
        style={{
          marginTop: space.unit * 3,
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {ownKey ? copy.ownKeyActive : quotaLine(preferences.quota)}
      </Text>
      {spent ? (
        <View>
          <PlusPurchase lane={preferences.quota.lane ?? 'free'} showPrice />
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
        <View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={preferences.disclosureAccepted}
            multiline
            placeholder={
              answered ? copy.scenario.followUp : copy.scenarioPlaceholder
            }
            placeholderTextColor={colors.inkMuted}
            accessibilityLabel={
              answered ? copy.scenario.followUp : copy.scenarioPlaceholder
            }
            style={{
              minHeight: space.target * 2,
              marginTop: space.unit * 3,
              color: colors.ink,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.field,
              padding: space.unit * 3,
              backgroundColor: colors.bgRaised,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.scenario.explain}
            accessibilityState={{ disabled: !canExplain }}
            disabled={!canExplain}
            onPress={() => {
              void explain(draft);
            }}
            style={{
              minHeight: space.target,
              justifyContent: 'center',
              paddingVertical: space.unit,
            }}
          >
            <Text
              style={{
                color: canExplain ? colors.accent : colors.inkMuted,
                flexShrink: 1,
              }}
            >
              {copy.scenario.explain}
            </Text>
          </Pressable>
        </View>
      )}
      {messages.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.scenario.newScenario}
          onPress={startNew}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>
            {copy.scenario.newScenario}
          </Text>
        </Pressable>
      ) : null}
      {threads.length > 0 ? (
        <View style={{ marginTop: space.unit * 4 }}>
          <Text
            style={{
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.scenario.saved}
          </Text>
          {threads.map((thread) => (
            <Pressable
              key={thread.id}
              accessibilityRole="button"
              accessibilityLabel={thread.title}
              onPress={() => {
                void openThread(thread.id);
              }}
              style={{ minHeight: space.target, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.ink }}>{thread.title}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MessageView({
  message,
  catalog,
}: {
  message: ThreadMessage;
  catalog: Map<string, CardSection>;
}) {
  const { colors } = useTheme();
  if (message.role === 'user') {
    return (
      <Text
        style={{
          marginTop: space.unit * 4,
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {message.content}
      </Text>
    );
  }
  const removed = (message.citations ?? []).filter(
    (citation) =>
      citationCardRoute(citation, catalog.get(citation.sectionId) ?? null) ===
      null,
  );
  const limits = [
    ...message.limits,
    ...(removed.length > 0 && !message.limits.includes(citationRemovedLimit)
      ? [citationRemovedLimit]
      : []),
  ];
  return (
    <View style={{ marginTop: space.unit * 4 }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {message.content}
      </Text>
      {message.illustration ? (
        <Text
          style={{
            marginTop: space.unit * 2,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.ask.illustrationLabel}. {message.illustration}
        </Text>
      ) : null}
      {limits.map((limit) => (
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
      {(message.citations ?? []).map((citation) => {
        const section = catalog.get(citation.sectionId) ?? null;
        const route = citationCardRoute(citation, section);
        if (!route || !section) return null;
        return (
          <CitationCard
            key={`${citation.sectionId}:${citation.quote}`}
            shortTitle={section.shortTitle}
            number={section.number}
            heading={section.heading}
            quote={citation.quote}
            onOpen={() => router.push(route as Href)}
          />
        );
      })}
    </View>
  );
}
