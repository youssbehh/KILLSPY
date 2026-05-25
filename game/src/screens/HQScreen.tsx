import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, useWindowDimensions, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { KS } from '../theme/colors';
import { TYPO, SIZES } from '../theme/typography';
import { MOTION } from '../theme/motion';
import { TopoBg, ChamferContainer, GlassCard, SectionLabel, HexAvatar, Currency, PrimaryButton } from '../components/ks';
import { useAuthStore } from '../stores/authStore';
import { useMyGuild, useGuildList, useCreateGuild, useJoinGuild, useLeaveGuild } from '../hooks/useGuilds';
import { GuildDTO } from '../api/guilds';

const PAD = 16;
const GUILD_COST = 5_000;

// ── Role badge ─────────────────────────────────────────────────────────────
const ROLE_COLOR = { LEADER: KS.alert, OFFICER: KS.primary, MEMBER: KS.inkDim };
const ROLE_LABEL = { LEADER: 'LEADER', OFFICER: 'OFFICER', MEMBER: 'MEMBRE' };

// ── Guild row card ─────────────────────────────────────────────────────────
const GuildRow: React.FC<{ guild: GuildDTO; onJoin: () => void; joining: boolean }> = ({ guild, onJoin, joining }) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - PAD * 2;
  return (
    <ChamferContainer width={cardWidth} height={76} chamfer={8} variant="tr-bl" fill={KS.surface} stroke={KS.hairSoft}>
      <View style={guildRowStyles.inner}>
        <View style={guildRowStyles.left}>
          <View style={guildRowStyles.tagWrap}>
            <Text style={guildRowStyles.tag}>[{guild.tag}]</Text>
          </View>
          <View>
            <Text style={guildRowStyles.name}>{guild.name}</Text>
            <Text style={guildRowStyles.meta}>
              {guild.memberCount}/{guild.maxMembers} membres · {guild.isOpen ? 'OUVERT' : 'FERMÉ'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onJoin}
          disabled={!guild.isOpen || joining}
          style={[
            guildRowStyles.joinBtn,
            (!guild.isOpen) && guildRowStyles.joinBtnDisabled,
          ]}
        >
          {joining
            ? <ActivityIndicator size="small" color={KS.live} />
            : <Text style={guildRowStyles.joinText}>{guild.isOpen ? 'REJOINDRE' : 'FERMÉ'}</Text>}
        </Pressable>
      </View>
    </ChamferContainer>
  );
};
const guildRowStyles = StyleSheet.create({
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagWrap: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: KS.primary + '18', borderWidth: 1, borderColor: KS.primary,
  },
  tag: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.18 },
  name: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.06 },
  meta: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.14, marginTop: 2 },
  joinBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: KS.live,
    backgroundColor: KS.live + '18',
  },
  joinBtnDisabled: { borderColor: KS.hairSoft, backgroundColor: 'transparent' },
  joinText: { color: KS.live, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.18 },
});

// ── Create guild modal ─────────────────────────────────────────────────────
const CreateModal: React.FC<{ visible: boolean; onClose: () => void; cardWidth: number }> = ({ visible, onClose, cardWidth }) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const { mutate: create, isPending, error } = useCreateGuild();
  const money = useAuthStore((s) => s.user?.money ?? 0);
  const canAfford = money >= GUILD_COST;

  const translateY = useSharedValue(400);
  React.useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 20, stiffness: 200 })
      : withTiming(400, { duration: MOTION.exit, easing: Easing.in(Easing.cubic) });
  }, [visible]);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleCreate = () => {
    if (!name.trim() || !tag.trim()) { Alert.alert('Erreur', 'Nom et tag requis.'); return; }
    create({ name: name.trim(), tag: tag.trim(), description: desc.trim() || undefined }, {
      onSuccess: () => { setName(''); setTag(''); setDesc(''); onClose(); },
      onError: (e: any) => Alert.alert('Erreur', e?.response?.data?.message ?? e.message),
    });
  };

  if (!visible) return null;
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>
      <Animated.View style={[createStyles.sheet, sheetStyle]}>
        <View style={createStyles.header}>
          <View>
            <Text style={createStyles.eyebrow}>// NOUVELLE UNITÉ</Text>
            <Text style={createStyles.title}>FONDER UNE GUILDE</Text>
          </View>
          <Pressable onPress={onClose} style={createStyles.closeBtn}>
            <Text style={createStyles.closeText}>✕</Text>
          </Pressable>
        </View>

        <Text style={createStyles.costLine}>
          Coût : <Text style={{ color: canAfford ? KS.alert : KS.danger }}>◈ {GUILD_COST.toLocaleString()}</Text>
          {' '}<Text style={{ color: KS.inkDim }}>· Solde : ◈ {money.toLocaleString()}</Text>
        </Text>
        {!canAfford && <Text style={createStyles.noFunds}>⚠ Fonds insuffisants. Gagne plus de parties.</Text>}

        <Text style={createStyles.fieldLabel}>NOM DE LA GUILDE</Text>
        <TextInput
          style={createStyles.input}
          placeholder="Ex: Les Fantômes"
          placeholderTextColor={KS.inkFaint}
          value={name}
          onChangeText={setName}
          maxLength={24}
        />
        <Text style={createStyles.fieldLabel}>TAG  (2-5 CARACTÈRES)</Text>
        <TextInput
          style={createStyles.input}
          placeholder="GHST"
          placeholderTextColor={KS.inkFaint}
          value={tag}
          onChangeText={(t) => setTag(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={5}
          autoCapitalize="characters"
        />
        <Text style={createStyles.fieldLabel}>DESCRIPTION (OPTIONNEL)</Text>
        <TextInput
          style={[createStyles.input, { height: 64 }]}
          placeholder="Guilde élite pour agents confirmés..."
          placeholderTextColor={KS.inkFaint}
          value={desc}
          onChangeText={setDesc}
          maxLength={120}
          multiline
        />

        <PrimaryButton
          label="FONDER L'UNITÉ"
          subLabel={`COÛT : ◈ ${GUILD_COST.toLocaleString()}`}
          onPress={handleCreate}
          size="large"
          style={{ marginTop: 12, opacity: canAfford ? 1 : 0.4 }}
        />
        {isPending && <ActivityIndicator color={KS.primary} style={{ marginTop: 8 }} />}
      </Animated.View>
    </Modal>
  );
};
const createStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: KS.bg, borderTopWidth: 1, borderColor: KS.hairSoft,
    padding: 20, paddingBottom: 36, gap: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  eyebrow: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.32 },
  title: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleMd, letterSpacing: SIZES.titleMd * 0.08, marginTop: 2 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: KS.surface, borderRadius: 4 },
  closeText: { color: KS.inkMute, fontFamily: TYPO.mono, fontSize: 14 },
  costLine: { color: KS.ink, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.14 },
  noFunds: { color: KS.danger, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  fieldLabel: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.22, marginTop: 4 },
  input: {
    height: 44, backgroundColor: KS.surface, borderWidth: 1, borderColor: KS.hairSoft,
    color: KS.ink, fontFamily: TYPO.ui, fontSize: SIZES.body,
    paddingHorizontal: 12, paddingVertical: 8,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────
export const HQScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - PAD * 2;
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: myGuild, isLoading: loadingMine } = useMyGuild();
  const { data: listData, isLoading: loadingList } = useGuildList(search || undefined);
  const { mutate: join } = useJoinGuild();
  const { mutate: leave } = useLeaveGuild();
  const money = useAuthStore((s) => s.user?.money ?? 0);

  const handleJoin = (guildId: number) => {
    setJoiningId(guildId);
    join(guildId, {
      onSettled: () => setJoiningId(null),
      onError: (e: any) => Alert.alert('Erreur', e?.response?.data?.message ?? e.message),
    });
  };

  const handleLeave = () => {
    Alert.alert('Quitter la guilde', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => leave() },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TopoBg />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: PAD }]} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>// QUARTIER GÉNÉRAL</Text>
              <Text style={styles.title}>GUILDES</Text>
            </View>
            <Currency kind="coin" value={money} />
          </View>

          {/* My guild dashboard OR no-guild CTA */}
          {loadingMine ? (
            <ActivityIndicator color={KS.primary} style={{ marginTop: 24 }} />
          ) : myGuild ? (
            <View style={{ gap: 10 }}>
              {/* Guild banner */}
              <GlassCard width={cardWidth} height={100} chamfer={12} variant="tr-bl" style={{ marginTop: 12 }}>
                <View style={styles.guildBanner}>
                  <View style={styles.guildBannerLeft}>
                    <View style={styles.tagBig}>
                      <Text style={styles.tagBigText}>[{myGuild.tag}]</Text>
                    </View>
                    <View>
                      <Text style={styles.guildName}>{myGuild.name}</Text>
                      <Text style={[styles.myRole, { color: ROLE_COLOR[myGuild.myRole ?? 'MEMBER'] }]}>
                        {ROLE_LABEL[myGuild.myRole ?? 'MEMBER']}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.memberCount}>{myGuild.memberCount}/{myGuild.maxMembers}</Text>
                </View>
              </GlassCard>

              {/* Members list */}
              <SectionLabel label={`Membres · ${myGuild.memberCount}`} />
              {myGuild.members?.map((m) => (
                <ChamferContainer key={m.userId} width={cardWidth} height={52} chamfer={6} variant="tl-br" fill={KS.surface} stroke={KS.hairSoft}>
                  <View style={styles.memberRow}>
                    <HexAvatar size={28} tier="silver" initials={m.username.slice(0, 2).toUpperCase()} />
                    <Text style={styles.memberName}>{m.username.toUpperCase()}</Text>
                    <Text style={[styles.memberRole, { color: ROLE_COLOR[m.role] }]}>{ROLE_LABEL[m.role]}</Text>
                    <Text style={styles.memberMmr}>{m.mmr.toLocaleString()} MMR</Text>
                  </View>
                </ChamferContainer>
              ))}

              {/* Leave */}
              <Pressable onPress={handleLeave} style={styles.leaveBtn}>
                <Text style={styles.leaveBtnText}>QUITTER LA GUILDE</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 10 }}>
              {/* No guild — create CTA */}
              <GlassCard width={cardWidth} height={110} chamfer={12} variant="tr-bl">
                <View style={styles.noGuildCard}>
                  <View>
                    <Text style={styles.noGuildTitle}>AUCUNE UNITÉ</Text>
                    <Text style={styles.noGuildSub}>Fondez votre guilde ou rejoignez-en une.</Text>
                  </View>
                  <Pressable onPress={() => setShowCreate(true)} style={styles.foundBtn}>
                    <Text style={styles.foundBtnCost}>◈ {GUILD_COST.toLocaleString()}</Text>
                    <Text style={styles.foundBtnLabel}>FONDER</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* Search */}
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher une guilde…"
                  placeholderTextColor={KS.inkFaint}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Guild list */}
              <SectionLabel label={`Guildes disponibles · ${listData?.guilds.length ?? 0}`} />
              {loadingList
                ? <ActivityIndicator color={KS.primary} />
                : listData?.guilds.map((g) => (
                    <GuildRow
                      key={g.id}
                      guild={g}
                      onJoin={() => handleJoin(g.id)}
                      joining={joiningId === g.id}
                    />
                  ))}
            </View>
          )}

          <View style={{ height: 108 }} />
        </ScrollView>

        <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} cardWidth={cardWidth} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KS.bg },
  scroll: { paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: KS.primary, fontFamily: TYPO.mono, fontSize: SIZES.monoSm, letterSpacing: SIZES.monoSm * 0.32 },
  title: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleMd, letterSpacing: SIZES.titleMd * 0.1, marginTop: 2 },

  guildBanner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  guildBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagBig: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: KS.alert, backgroundColor: KS.alert + '18' },
  tagBigText: { color: KS.alert, fontFamily: TYPO.display, fontSize: SIZES.titleSm, letterSpacing: SIZES.titleSm * 0.1 },
  guildName: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleSm, letterSpacing: SIZES.titleSm * 0.06 },
  myRole: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.22, marginTop: 2 },
  memberCount: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoSm },

  memberRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  memberName: { flex: 1, color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.06 },
  memberRole: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.18 },
  memberMmr: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },

  leaveBtn: {
    marginTop: 8, paddingVertical: 12, borderWidth: 1, borderColor: KS.danger,
    backgroundColor: KS.danger + '14', alignItems: 'center',
  },
  leaveBtnText: { color: KS.danger, fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.1 },

  noGuildCard: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  noGuildTitle: { color: KS.ink, fontFamily: TYPO.display, fontSize: SIZES.titleSm, letterSpacing: SIZES.titleSm * 0.06 },
  noGuildSub: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoXs, marginTop: 4 },
  foundBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: KS.alert, backgroundColor: KS.alert + '18',
    alignItems: 'center',
  },
  foundBtnCost: { color: KS.alert, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  foundBtnLabel: { color: KS.alert, fontFamily: TYPO.display, fontSize: SIZES.labelLg, letterSpacing: SIZES.labelLg * 0.1, marginTop: 2 },

  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, height: 40, backgroundColor: KS.surface, borderWidth: 1, borderColor: KS.hairSoft,
    color: KS.ink, fontFamily: TYPO.ui, fontSize: SIZES.body,
    paddingHorizontal: 12,
  },
});
