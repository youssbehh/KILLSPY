import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { GlassCard } from '../../components/ks';
import { GuildDTO } from '../../api/guilds';
import { useGuildList } from '../../hooks/useGuilds';
import { useHqT } from './strings';
import { CreateGuildModal } from './CreateGuildModal';
import { GuildDirectory } from './GuildDirectory';
import { InvitesSection } from './InvitesSection';
import { MIN_TOUCH, PAD, tint } from './ui';

const SEARCH_DEBOUNCE_MS = 350;
const SCROLL_BOTTOM_PAD = 100;

const useDebounced = (value: string, delay: number): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/** What a player without a guild sees: invitations, the "found a guild" card and the directory. */
export const NoGuildView: React.FC<{ cardWidth: number }> = ({ cardWidth }) => {
  const t = useHqT();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const activeSearch = useDebounced(search.trim(), SEARCH_DEBOUNCE_MS);

  const list = useGuildList(activeSearch || undefined);
  const guilds: GuildDTO[] = list.guilds;
  const createCost: number = list.createCost;

  return (
    <>
      <ScrollView
        contentContainerStyle={[local.scroll, { paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <GlassCard width={cardWidth} height={110} chamfer={12} variant="tr-bl">
          <View style={local.cta}>
            <View style={local.ctaText}>
              <Text style={local.ctaTitle}>{t('noGuildTitle')}</Text>
              <Text style={local.ctaSub}>{t('noGuildSub')}</Text>
            </View>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={local.foundBtn}
              accessibilityRole="button"
              accessibilityLabel={t('foundA11y', { cost: createCost })}
            >
              <Text style={local.foundCost}>◈ {createCost.toLocaleString('en-US')}</Text>
              <Text style={local.foundLabel}>{t('found')}</Text>
            </Pressable>
          </View>
        </GlassCard>

        <InvitesSection />

        <GuildDirectory
          list={{
            guilds,
            hasNextPage: Boolean(list.hasNextPage),
            isFetchingNextPage: list.isFetchingNextPage,
            isLoading: list.isLoading,
            isError: list.isError,
            fetchNextPage: list.fetchNextPage,
            refetch: list.refetch,
          }}
          search={search}
          activeSearch={activeSearch}
          onSearchChange={setSearch}
          cardWidth={cardWidth}
        />
      </ScrollView>

      <CreateGuildModal visible={showCreate} createCost={createCost} onClose={() => setShowCreate(false)} />
    </>
  );
};

const local = StyleSheet.create({
  scroll: { paddingHorizontal: PAD, paddingTop: 12, gap: 16 },
  cta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  ctaText: { flex: 1 },
  ctaTitle: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.06,
  },
  ctaSub: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, marginTop: 4 },
  foundBtn: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: KS.alert,
    backgroundColor: tint(KS.alert),
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundCost: { color: KS.alert, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  foundLabel: {
    color: KS.alert,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.1,
    marginTop: 2,
  },
});
