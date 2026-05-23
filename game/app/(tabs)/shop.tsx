import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useShop, usePurchase } from '@/src/hooks/useShop';
import { useMyStats } from '@/src/hooks/useGames';
import { RarityBadge } from '@/src/ui/RarityBadge';
import { ShopOffer } from '@/src/api/shop';
import { RARITIES } from '@/src/game/rarities';
import { extractApiError } from '@/src/api/client';

const formatTime = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function ShopScreen() {
  const { langIndex } = useLanguageStore();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const { data: offers, isLoading, error } = useShop();
  const { data: stats } = useMyStats();
  const purchase = usePurchase();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRotation = useMemo(() => {
    if (!offers?.length) return null;
    return Math.min(...offers.map((o: ShopOffer) => new Date(o.validUntil).getTime()));
  }, [offers]);

  const handlePurchase = (offer: ShopOffer) => {
    Alert.alert(
      `Acheter ${offer.name} ?`,
      `Prix : ${offer.price}\nRareté : ${RARITIES[offer.rarity].label}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Acheter',
          onPress: () =>
            purchase.mutate(offer.offerId, {
              onSuccess: (res) =>
                Alert.alert('Acheté !', `${res.itemName} ajouté à votre inventaire.`),
              onError: (e) => Alert.alert('Erreur', extractApiError(e).message),
            }),
        },
      ],
    );
  };

  if (isGuest) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{motTraduit(langIndex, 4)}</Text>
        <Text style={styles.guest}>{motTraduit(langIndex, 70)}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ShopOffer }) => {
    const r = RARITIES[item.rarity];
    return (
      <View style={[styles.card, { borderColor: r.color }]}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <RarityBadge rarity={item.rarity} small />
          </View>
          <Text style={styles.cardType}>{item.type.replace('_', ' ')}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>{item.price} 💰</Text>
            <Pressable
              onPress={() => handlePurchase(item)}
              disabled={item.alreadyOwned || purchase.isPending}
              style={[
                styles.buyButton,
                (item.alreadyOwned || purchase.isPending) && styles.buyButtonDisabled,
              ]}
            >
              <Text style={styles.buyButtonText}>
                {item.alreadyOwned ? 'Possédé' : 'Acheter'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{motTraduit(langIndex, 4)}</Text>
        <Text style={styles.balance}>{stats?.user.money ?? '—'} 💰</Text>
      </View>
      {nextRotation ? (
        <Text style={styles.rotation}>Rotation dans {formatTime(nextRotation - now)}</Text>
      ) : null}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : error ? (
        <Text style={styles.errorText}>Impossible de charger la boutique.</Text>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderItem}
          keyExtractor={(o) => o.offerId.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  guest: { marginTop: 12, textAlign: 'center', paddingHorizontal: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  balance: { fontSize: 18, fontWeight: '700' },
  rotation: { textAlign: 'center', color: 'gray', marginVertical: 6, fontSize: 12 },
  listContent: { padding: 12, gap: 10 },
  card: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: 10,
    padding: 8,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#222' },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontWeight: '700', fontSize: 14, flex: 1, marginRight: 6 },
  cardType: { fontSize: 11, color: 'gray', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 14, fontWeight: '700' },
  buyButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#007AFF' },
  buyButtonDisabled: { backgroundColor: '#666' },
  buyButtonText: { color: 'white', fontWeight: '700', fontSize: 12 },
  errorText: { textAlign: 'center', color: 'red', marginTop: 30 },
});
