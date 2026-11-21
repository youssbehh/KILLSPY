import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { KS, RarityName } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { TopoBg } from '../components/ks/TopoBg';
import { ChamferContainer } from '../components/ks/ChamferContainer';
import { GlassCard } from '../components/ks/GlassCard';
import { SectionLabel } from '../components/ks/SectionLabel';
import { Currency } from '../components/ks/Currency';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useShop, usePurchase } from '../hooks/useShop';
import { useAuthStore } from '../stores/authStore';
import { extractApiError } from '../api/client';
import { CosmeticType, ShopOffer } from '../api/shop';
import { RarityId } from '../game/rarities';

const PAD = 16;
const ITEM_KINDS = ['ALL', 'AVATARS', 'SKINS', 'THEMES', 'FX'] as const;
type ItemKind = typeof ITEM_KINDS[number];

interface ShopItem {
  id: string;
  offerId: number;
  tab: Exclude<ItemKind, 'ALL'>;
  kind: 'agent' | 'weapon' | 'emote' | 'bundle' | 'crate';
  name: string;
  rarity: RarityName;
  currency: 'coin' | 'gem';
  price: number;
  oldPrice?: number;
  salePct?: number;
  owned?: boolean;
  soldOut?: boolean;
}

const TYPE_META: Record<CosmeticType, { kind: ShopItem['kind']; tab: Exclude<ItemKind, 'ALL'> }> = {
  avatar:      { kind: 'agent',  tab: 'AVATARS' },
  card_skin:   { kind: 'crate',  tab: 'SKINS' },
  background:  { kind: 'bundle', tab: 'THEMES' },
  ui_theme:    { kind: 'bundle', tab: 'THEMES' },
  emote:       { kind: 'emote',  tab: 'FX' },
  shoot_anim:  { kind: 'weapon', tab: 'FX' },
  shield_anim: { kind: 'weapon', tab: 'FX' },
  name_effect: { kind: 'emote',  tab: 'FX' },
};

// The design system has 4 rarity colours; the API has 7 tiers.
const RARITY_COLOR: Record<RarityId, RarityName> = {
  common: 'common',
  uncommon: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
  mythic: 'legendary',
  secret: 'legendary',
};

const RARITY_WEIGHT: Record<RarityId, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, secret: 6,
};

const toShopItem = (o: ShopOffer): ShopItem & { rarityId: RarityId; validUntil: number } => {
  const meta = TYPE_META[o.type] ?? { kind: 'crate' as const, tab: 'FX' as const };
  const discounted = o.price < o.basePrice;
  return {
    id: String(o.offerId),
    offerId: o.offerId,
    tab: meta.tab,
    kind: meta.kind,
    name: o.name.toUpperCase(),
    rarity: RARITY_COLOR[o.rarity] ?? 'common',
    rarityId: o.rarity,
    currency: 'coin',
    price: o.price,
    oldPrice: discounted ? o.basePrice : undefined,
    salePct: discounted ? Math.round((1 - o.price / o.basePrice) * 100) : undefined,
    owned: o.alreadyOwned,
    validUntil: new Date(o.validUntil).getTime(),
  };
};

function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export const ShopScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<ItemKind>('ALL');
  const [now, setNow] = useState(() => Date.now());
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const money = useAuthStore((s) => s.user?.money ?? 0);
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const { data: offers, isLoading, isError, refetch } = useShop();
  const purchase = usePurchase();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const items = useMemo(() => ((offers ?? []) as ShopOffer[]).map(toShopItem), [offers]);
  // Featured = the rarest offer not owned yet.
  const featured = useMemo(
    () =>
      [...items]
        .filter((i) => !i.owned)
        .sort((a, b) => RARITY_WEIGHT[b.rarityId] - RARITY_WEIGHT[a.rarityId])[0] ?? null,
    [items],
  );
  const visible = items.filter((i) => tab === 'ALL' || i.tab === tab);
  const rotateMs = items.length > 0 ? Math.min(...items.map((i) => i.validUntil)) - now : 0;

  const handleBuy = (item: ShopItem) => {
    if (purchase.isPending || item.owned) return;
    if (isGuest) return setFeedback({ text: 'CREATE AN ACCOUNT TO BUY', ok: false });
    if (money < item.price) return setFeedback({ text: 'NOT ENOUGH COINS', ok: false });
    // Two-step purchase: first tap arms the button, second tap confirms.
    if (confirmId !== item.offerId) {
      setFeedback(null);
      return setConfirmId(item.offerId);
    }
    purchase.mutate(item.offerId, {
      onSuccess: (result) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setFeedback({ text: `${result.itemName.toUpperCase()} ACQUIRED`, ok: true });
      },
      onError: (e) => setFeedback({ text: extractApiError(e).message.toUpperCase(), ok: false }),
      onSettled: () => setConfirmId(null),
    });
  };

  const cardWidth = width - PAD * 2;
  const itemWidth = (cardWidth - 8) / 2;

  return (
    <View style={styles.container}>
      <TopoBg />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.eyebrow}>// MARCHÉ NOIR</Text>
            <Text style={styles.title}>BLACK MARKET</Text>
          </View>
          <View style={styles.currencies}>
            <Currency kind="coin" value={money} />
          </View>
        </View>

        {/* Daily reset banner */}
        <ChamferContainer
          width={cardWidth}
          height={52}
          chamfer={8}
          variant="tr-bl"
          fill={KS.surface}
          stroke={KS.hairSoft}
          style={{ marginTop: 12 }}
        >
          <LinearGradient
            colors={[KS.alert, '#ffa000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 1 }}
          />
          <View style={styles.bannerInner}>
            <Text style={styles.bannerLabel}>DAILY DROP · ROTATES IN</Text>
            <Text style={[styles.bannerTimer, { color: KS.live }]}>
              {items.length > 0 ? formatCountdown(rotateMs) : '--:--:--'}
            </Text>
          </View>
        </ChamferContainer>

        {/* Tab strip */}
        <View style={styles.tabs}>
          {ITEM_KINDS.map((k) => (
            <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} hitSlop={8}>
              <View style={[styles.tab, tab === k && styles.tabActive]}>
                <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{k}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {feedback && (
          <Text style={[styles.feedback, { color: feedback.ok ? KS.live : KS.danger }]}>
            › {feedback.text}
          </Text>
        )}

        {isLoading && <ActivityIndicator color={KS.primary} style={{ marginTop: 40 }} />}

        {isError && (
          <Pressable onPress={() => refetch()} accessibilityRole="button" style={styles.stateBox}>
            <Text style={[styles.stateText, { color: KS.danger }]}>MARKET UNREACHABLE</Text>
            <Text style={styles.stateHint}>TAP TO RETRY</Text>
          </Pressable>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>NO DROP TODAY</Text>
            <Text style={styles.stateHint}>COME BACK AFTER THE NEXT ROTATION</Text>
          </View>
        )}

        {/* Featured hero card */}
        {tab === 'ALL' && featured && (
          <FeaturedCard
            item={featured}
            width={cardWidth}
            armed={confirmId === featured.offerId}
            pending={purchase.isPending && confirmId === featured.offerId}
            onBuy={() => handleBuy(featured)}
          />
        )}

        {/* Section header */}
        {visible.length > 0 && (
          <View style={{ marginTop: 16, marginBottom: 10 }}>
            <SectionLabel label={`Today's Lineup · ${visible.length} items`} />
          </View>
        )}

        {/* 2-column grid */}
        <View style={styles.grid}>
          {visible.map((item) => (
            <ShopCard
              key={item.id}
              item={item}
              width={itemWidth}
              armed={confirmId === item.offerId}
              pending={purchase.isPending && confirmId === item.offerId}
              onBuy={() => handleBuy(item)}
            />
          ))}
        </View>

        <Text style={styles.footer}>// ALL TRANSACTIONS LOGGED · MIMIR LEDGER</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

// ── Sub-components ──

const FeaturedCard: React.FC<{ item: ShopItem; width: number; armed: boolean; pending: boolean; onBuy: () => void }> = ({ item, width, armed, pending, onBuy }) => {
  const rarityColor = KS.rarity[item.rarity] ?? KS.rarity.common;

  return (
    <ChamferContainer
      width={width}
      height={168}
      chamfer={12}
      variant="tr-bl"
      fill={KS.surface}
      stroke={rarityColor}
      strokeWidth={1}
      style={{ marginTop: 8 }}
    >
      <View style={featured.inner}>
        {/* Left graphic */}
        <View style={[featured.graphic, { borderRightColor: rarityColor }]}>
          <ItemIcon kind={item.kind} color={rarityColor} size={64} />
        </View>

        {/* Right details */}
        <View style={featured.details}>
          <Text style={[featured.rarity, { color: rarityColor }]}>
            {item.rarity.toUpperCase()}
          </Text>
          <Text style={featured.name}>{item.name}</Text>
          <Text style={featured.desc}>LIMITED TIME OFFER · {item.tab}</Text>

          <View style={featured.priceRow}>
            {item.oldPrice && (
              <Text style={featured.oldPrice}>
                {item.currency === 'gem' ? '✦' : '◈'} {item.oldPrice}
              </Text>
            )}
            <Pressable
              style={featured.buyBtn}
              onPress={onBuy}
              disabled={pending}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${item.name} for ${item.price} coins`}
              hitSlop={10}
            >
              <Text style={featured.buyGlyph}>◈</Text>
              <Text style={featured.buyPrice}>{pending ? '…' : armed ? 'CONFIRM' : item.price}</Text>
            </Pressable>
          </View>

          {item.salePct && (
            <View style={featured.saleBadge}>
              <Text style={featured.saleText}>−{item.salePct}%</Text>
            </View>
          )}
        </View>
      </View>
    </ChamferContainer>
  );
};

const ShopCard: React.FC<{ item: ShopItem; width: number; armed: boolean; pending: boolean; onBuy: () => void }> = ({ item, width, armed, pending, onBuy }) => {
  const rarityColor = KS.rarity[item.rarity] ?? KS.rarity.common;

  return (
    <ChamferContainer
      width={width}
      height={200}
      chamfer={8}
      variant="tr-bl"
      fill={KS.surface}
      stroke={rarityColor}
      strokeWidth={1}
    >
      {/* Rarity glow stripe at top */}
      <View style={[card.topStripe, { backgroundColor: rarityColor }]} />

      {/* Item graphic */}
      <View style={card.graphic}>
        <ItemIcon kind={item.kind} color={rarityColor} size={48} />
      </View>

      {/* Bottom info */}
      <View style={card.bottom}>
        <Text style={[card.rarity, { color: rarityColor }]}>
          {item.rarity.toUpperCase()}
        </Text>
        <Text style={card.name}>{item.name}</Text>
        <View style={card.priceRow}>
          <Text style={[card.currencyGlyph, { color: item.currency === 'gem' ? KS.live : KS.alert }]}>
            {item.currency === 'gem' ? '✦' : '◈'}
          </Text>
          <Text style={card.price}>{item.price}</Text>
          <Pressable
            style={card.buyBtn}
            onPress={onBuy}
            disabled={pending || item.owned}
            accessibilityRole="button"
            accessibilityLabel={`Buy ${item.name} for ${item.price} coins`}
            hitSlop={12}
          >
            <Text style={card.buyText}>{pending ? '…' : armed ? 'OK ?' : 'BUY'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Overlays */}
      {item.owned && (
        <View style={[StyleSheet.absoluteFill, card.overlay]}>
          <Text style={card.ownedText}>✓ OWNED</Text>
        </View>
      )}
      {item.soldOut && (
        <View style={[StyleSheet.absoluteFill, card.overlay]}>
          <Text style={[card.ownedText, { color: KS.danger }]}>SOLD OUT</Text>
        </View>
      )}
      {item.salePct && !item.owned && !item.soldOut && (
        <View style={card.saleRibbon}>
          <Text style={card.saleRibbonText}>−{item.salePct}%</Text>
        </View>
      )}
    </ChamferContainer>
  );
};

const ItemIcon: React.FC<{ kind: ShopItem['kind']; color: string; size: number }> = ({ kind, color, size }) => {
  const s = size * 0.7;
  switch (kind) {
    case 'agent':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M4,20 Q4,14 12,14 Q20,14 20,20" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'weapon':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M3,12 L15,12 L16,10 L20,10 L20,14 L16,14 L15,12 M15,12 L17,12 M7,12 L7,16" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case 'emote':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M8,14 Q12,18 16,14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Circle cx="9" cy="10" r="1" fill={color} />
          <Circle cx="15" cy="10" r="1" fill={color} />
        </Svg>
      );
    case 'bundle':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="4" y="8" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
          <Rect x="6" y="4" width="10" height="8" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
        </Svg>
      );
    case 'crate':
    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12,3 L20,7 L20,17 L12,21 L4,17 L4,7 Z" stroke={color} strokeWidth="1.5" fill="none" />
          <Path d="M12,3 L12,21 M4,7 L20,7" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        </Svg>
      );
  }
};

const styles = StyleSheet.create({
  feedback: { fontFamily: TYPO.mono, fontSize: SIZES.monoSm, marginTop: 10 },
  stateBox: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  stateText: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleSm },
  stateHint: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { paddingTop: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  eyebrow: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.18,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleLg,
    letterSpacing: SIZES.titleLg * 0.04,
  },
  currencies: { flexDirection: 'row', gap: 6 },
  bannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingLeft: 18,
  },
  bannerLabel: {
    color: KS.inkMute,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    letterSpacing: SIZES.monoXs * 0.18,
  },
  bannerTimer: {
    fontFamily: TYPO.monoBold,
    fontSize: SIZES.monoLg,
    letterSpacing: SIZES.monoLg * 0.18,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  tabActive: { backgroundColor: KS.primary, borderColor: KS.primary },
  tabText: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  tabTextActive: { color: KS.ink },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    color: KS.inkFaint,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXxs,
    letterSpacing: SIZES.monoXxs * 0.18,
    textAlign: 'center',
    marginTop: 16,
  },
});

const featured = StyleSheet.create({
  inner: { flex: 1, flexDirection: 'row' },
  graphic: {
    width: '44%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: KS.hairSoft,
  },
  details: { flex: 1, padding: 12, justifyContent: 'space-between' },
  rarity: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.18 },
  name: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.04,
  },
  desc: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXxs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oldPrice: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoXs,
    textDecorationLine: 'line-through',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KS.alert,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buyGlyph: { color: KS.bg, fontFamily: TYPO.mono, fontSize: SIZES.monoSm },
  buyPrice: { color: KS.bg, fontFamily: TYPO.monoBold, fontSize: SIZES.monoSm },
  saleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: KS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleText: { color: KS.ink, fontFamily: TYPO.monoBold, fontSize: SIZES.monoXxs },
});

const card = StyleSheet.create({
  topStripe: { height: 3, width: '100%' },
  graphic: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: 10, gap: 3 },
  rarity: { fontFamily: TYPO.mono, fontSize: SIZES.monoXxs, letterSpacing: SIZES.monoXxs * 0.18 },
  name: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.labelLg },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  currencyGlyph: { fontFamily: TYPO.monoBold, fontSize: SIZES.monoSm },
  price: { color: KS.ink, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, flex: 1 },
  buyBtn: {
    backgroundColor: KS.alert,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  buyText: { color: KS.bg, fontFamily: TYPO.monoBold, fontSize: SIZES.monoXxs },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
  },
  ownedText: {
    color: KS.live,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleSm,
    letterSpacing: SIZES.titleSm * 0.06,
    transform: [{ rotate: '-20deg' }],
  },
  saleRibbon: {
    position: 'absolute',
    top: 10,
    right: -4,
    backgroundColor: KS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  saleRibbonText: { color: KS.ink, fontFamily: TYPO.monoBold, fontSize: SIZES.monoXxs },
});
