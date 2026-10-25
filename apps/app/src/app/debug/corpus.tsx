import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  contentVersionOf,
  findSection,
  shippingInstrument,
} from '@nigeria-law/content';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const instrument = shippingInstrument();

export default function CorpusDebugScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('cfrn-1999:s:1');
  const [opened, setOpened] = useState(query);
  const located = findSection(instrument, opened);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title="Corpus"
        actionLabel="Close"
        onAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: space.unit * 6 }}>
        <Text
          style={{
            marginTop: space.unit * 4,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {instrument.title}
        </Text>
        <Text
          style={{
            marginTop: space.unit,
            color: colors.inkMuted,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {contentVersionOf(instrument)}
        </Text>
        <Text
          selectable
          style={{
            marginTop: space.unit * 2,
            color: colors.inkMuted,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {`Legal text ${instrument.legalTextHash}`}
        </Text>
        <Text
          selectable
          style={{
            marginTop: space.unit,
            color: colors.inkMuted,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {`Index ${instrument.indexHash}`}
        </Text>
        <TextInput
          accessibilityLabel="Section id"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          onSubmitEditing={() => setOpened(query)}
          placeholder="cfrn-1999:s:36"
          placeholderTextColor={colors.inkMuted}
          value={query}
          style={{
            marginTop: space.unit * 4,
            minHeight: space.target,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.field,
            paddingHorizontal: space.unit * 3,
            color: colors.ink,
            backgroundColor: colors.bgRaised,
            fontSize: typeScale.ui.fontSize,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open section"
          onPress={() => setOpened(query)}
          style={{
            marginTop: space.unit * 3,
            minHeight: space.target,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            borderRadius: radius.field,
          }}
        >
          <Text style={{ color: colors.bg, fontSize: typeScale.ui.fontSize }}>
            Open
          </Text>
        </Pressable>
        {located ? (
          <View style={{ marginTop: space.unit * 5 }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: typeScale.heading.fontSize,
                lineHeight: typeScale.heading.lineHeight,
              }}
            >
              {located.path}
            </Text>
            <Text
              style={{
                marginTop: space.unit * 2,
                color: colors.inkMuted,
                fontSize: typeScale.ui.fontSize,
                lineHeight: typeScale.ui.lineHeight,
              }}
            >
              {instrument.source.name}
            </Text>
            <Text
              selectable
              style={{
                marginTop: space.unit * 4,
                color: colors.ink,
                fontSize: typeScale.provision.fontSize,
                lineHeight: typeScale.provision.lineHeight,
              }}
            >
              {located.section.plainText}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              marginTop: space.unit * 4,
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            No section has that id.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
