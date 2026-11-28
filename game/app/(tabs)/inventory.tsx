import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useInventory, useEquip, useUnequip } from '@/src/hooks/useInventory';
import { RarityBadge } from '@/src/components/ks/RarityBadge';
import { TopoBg } from '@/src/components/ks/TopoBg';
import { SectionLabel } from '@/src/components/ks/SectionLabel';
import { CosmeticType } from '@/src/api/shop';
import { OwnedCosmetic } from '@/src/api/inventory';
import { RARITIES } from '@/src/game/rarities';
import { extractApiError } from '@/src/api/client';
import { useT, I18nKey } from '@/src/i18n';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';
import { useLocalT } from '@/src/i18n/local';

const STRINGS = {
  fr: { back: 'Retour', eyebrow: '‹ // ARMURERIE' },
  en: { back: 'Back', eyebrow: '‹ // ARMORY' },
} as const;

const TYPE_LABEL: Record<CosmeticType, I18nKey> = {
  avatar: 'cosAvatar',
  card_skin: 'cosCardSkin',
  emote: 'cosEmote',
  background: 'cosBackground',
  ui_theme: 'cosTheme',
  shoot_anim: 'cosShootAnim',
  shield_anim: 'cosShieldAnim',
  name_effect: 'cosNameEffect',
};

export default function InventoryScreen() {
  const t = useT();
  const lt = useLocalT(STRINGS);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const { data, isLoading, isError, refetch } = useInventory();
  const equipMutation = useEquip();
  const unequipMutation = useUnequip();
  const [error, setError] = useState<string | null>(null);

  const owned: OwnedCosmetic[] = data?.owned ?? [];
  const types = Object.keys(TYPE_LABEL) as CosmeticType[];
  const sections = types
    .map((type) => ({ type, items: owned.filter((i) => i.type === type) }))
    .filter((s) => s.items.length > 0);

  const handleToggle = (item: OwnedCosmetic) => {
    setError(null);
    const onError = (e: unknown) => setError(extractApiError(e).message);
    if (item.equipped) unequipMutation.mutate(item.type, { onError });
    else equipMutation.mutate(item.itemId, { onError });
  };

  const busy = equipMutation.isPending || unequipMutation.isPending;

  return (
    <View style={styles.container}>
      <TopoBg />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={lt('back')} hitSlop={12}>
          <Text style={styles.eyebrow}>{lt('eyebrow')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('inventory').toUpperCase()}</Text>

        {error && <Text style={styles.error}>› {error}</Text>}

        {isGuest ? (
          <Text style={styles.state}>{t('guestUpgradePrompt')}</Text>
        ) : isLoading ? (
          <ActivityIndicator color={KS.primary} style={{ marginTop: 60 }} />
        ) : isError ? (
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text style={[styles.state, { color: KS.danger }]}>{t('loadError')}</Text>
          </Pressable>
        ) : sections.length === 0 ? (
          <Text style={styles.state}>{t('inventoryEmpty')}</Text>
        ) : (
          sections.map((section) => (
            <View key={section.type} style={styles.section}>
              <SectionLabel label={t(TYPE_LABEL[section.type])} />
              <View style={styles.grid}>
                {section.items.map((item) => {
                  const rarity = RARITIES[item.rarity];
                  return (
                    <Pressable
                      key={item.userCosmeticId}
                      onPress={() => handleToggle(item)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={item.name}
                      accessibilityState={{ selected: item.equipped }}
                      style={[styles.item, { borderColor: rarity.color }, item.equipped && styles.itemEquipped]}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.image} />
                      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                      <RarityBadge rarity={item.rarity} small />
                      <Text style={[styles.equipped, { opacity: item.equipped ? 1 : 0 }]}>
                        ✓ {t('equipped').toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  eyebrow: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.04,
    marginBottom: 8,
  },
  error: { color: KS.danger, fontFamily: TYPO.mono, fontSize: SIZES.monoMd, marginBottom: 8 },
  state: {
    color: KS.inkMute,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodyLg,
    textAlign: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  section: { marginTop: 16, gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    width: '31%',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    gap: 4,
    alignItems: 'center',
    backgroundColor: KS.surface,
  },
  itemEquipped: { backgroundColor: KS.surfaceHi, borderWidth: 2 },
  image: { width: 60, height: 60, borderRadius: 4, backgroundColor: KS.bg },
  name: { color: KS.ink, fontFamily: TYPO.uiBold, fontSize: SIZES.bodySm, textAlign: 'center' },
  equipped: { color: KS.live, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
});
