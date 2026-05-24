import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useInventory, useEquip, useUnequip } from '@/src/hooks/useInventory';
import { RarityBadge } from '@/src/ui/RarityBadge';
import { CosmeticType } from '@/src/api/shop';
import { OwnedCosmetic } from '@/src/api/inventory';
import { RARITIES } from '@/src/game/rarities';
import { extractApiError } from '@/src/api/client';

const TYPE_LABEL: Record<CosmeticType, string> = {
  avatar: 'Avatars',
  card_skin: 'Skins de carte',
  emote: 'Emotes',
  background: 'Fonds',
  ui_theme: 'Thèmes',
  shoot_anim: 'Anim. tir',
  shield_anim: 'Anim. bouclier',
  name_effect: 'Effets pseudo',
};

export default function InventoryScreen() {
  const { langIndex } = useLanguageStore();
  const isGuest = useAuthStore((s) => s.user?.guest ?? false);
  const { data, isLoading } = useInventory();
  const equipMutation = useEquip();
  const unequipMutation = useUnequip();

  if (isGuest) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{motTraduit(langIndex, 8)}</Text>
        <Text style={styles.guest}>{motTraduit(langIndex, 70)}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!data?.owned.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{motTraduit(langIndex, 8)}</Text>
        <Text style={styles.empty}>Aucun cosmétique. Direction la boutique !</Text>
      </View>
    );
  }

  const groups: Record<string, OwnedCosmetic[]> = {};
  for (const item of data.owned) {
    (groups[item.type] ||= []).push(item);
  }

  const sections = Object.keys(groups).map((type) => ({
    type: type as CosmeticType,
    items: groups[type],
  }));

  const handleToggle = (item: OwnedCosmetic) => {
    if (item.equipped) {
      unequipMutation.mutate(item.type, {
        onError: (e) => Alert.alert('Erreur', extractApiError(e).message),
      });
    } else {
      equipMutation.mutate(item.itemId, {
        onError: (e) => Alert.alert('Erreur', extractApiError(e).message),
      });
    }
  };

  const renderCosmetic = (item: OwnedCosmetic) => {
    const r = RARITIES[item.rarity];
    return (
      <Pressable
        key={item.userCosmeticId}
        onPress={() => handleToggle(item)}
        style={[
          styles.cosmetic,
          { borderColor: r.color },
          item.equipped && styles.equipped,
        ]}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <RarityBadge rarity={item.rarity} small />
        {item.equipped ? <Text style={styles.equippedBadge}>Équipé</Text> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{motTraduit(langIndex, 8)}</Text>
      <FlatList
        data={sections}
        keyExtractor={(s) => s.type}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TYPE_LABEL[section.type]}</Text>
            <View style={styles.grid}>{section.items.map(renderCosmetic)}</View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  guest: { marginTop: 12, textAlign: 'center', paddingHorizontal: 30 },
  empty: { marginTop: 20, textAlign: 'center', fontStyle: 'italic' },
  section: { marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cosmetic: {
    width: '31%',
    borderWidth: 2,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  equipped: { backgroundColor: 'rgba(0,255,128,0.1)' },
  image: { width: 60, height: 60, borderRadius: 6, backgroundColor: '#222', marginBottom: 4 },
  name: { fontSize: 11, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  equippedBadge: { fontSize: 9, color: '#39ff14', fontWeight: '700', marginTop: 2 },
});
