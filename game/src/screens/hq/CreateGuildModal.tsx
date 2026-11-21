import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { extractApiError } from '../../api/client';
import { useCreateGuild } from '../../hooks/useGuilds';
import { useAuthStore } from '../../stores/authStore';
import { GUILD_LIMITS, isValidGuildName, isValidGuildTag, useHqT } from './strings';
import { Feedback, FeedbackLine, Field, KsButton, MIN_TOUCH, styles as ui } from './ui';

interface Props {
  visible: boolean;
  createCost: number;
  onClose: () => void;
}

const formatCoins = (value: number): string => `◈ ${value.toLocaleString('en-US')}`;

/** Bottom sheet to found a guild. Closes itself once the guild exists. */
export const CreateGuildModal: React.FC<Props> = ({ visible, createCost, onClose }) => {
  const t = useHqT();
  const insets = useSafeAreaInsets();
  const money = useAuthStore((s) => s.user?.money ?? 0);
  const create = useCreateGuild();
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const canAfford = money >= createCost;
  const nameOk = isValidGuildName(name);
  const tagOk = isValidGuildTag(tag);
  const canSubmit = canAfford && nameOk && tagOk && !create.isPending;

  const validationHint =
    name.length > 0 && !nameOk ? t('errName') : tag.length > 0 && !tagOk ? t('errTag') : null;

  const handleCreate = () => {
    if (!canSubmit) return;
    setFeedback(null);
    create.mutate(
      { name: name.trim(), tag, description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setTag('');
          setDescription('');
          onClose();
        },
        onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
      },
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={local.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
        >
          <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <View style={local.spacer} pointerEvents="none" />
        <View style={[local.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={local.content}>
            <View style={local.header}>
              <View style={local.flex}>
                <Text style={local.eyebrow}>{t('createEyebrow')}</Text>
                <Text style={local.title}>{t('createTitle')}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={local.closeBtn}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
              >
                <Text style={local.closeText}>✕</Text>
              </Pressable>
            </View>

            <Text style={local.costLine}>
              {t('cost')} :{' '}
              <Text style={{ color: canAfford ? KS.alert : KS.danger }}>{formatCoins(createCost)}</Text>
              <Text style={{ color: KS.inkDim }}> · {t('balance')} : {formatCoins(money)}</Text>
            </Text>
            {!canAfford && <FeedbackLine feedback={{ text: t('noFunds'), ok: false }} />}

            <Field
              label={t('fieldName')}
              placeholder={t('fieldNamePlaceholder')}
              value={name}
              onChangeText={setName}
              maxLength={GUILD_LIMITS.nameMax}
            />
            <Field
              label={t('fieldTag')}
              placeholder={t('fieldTagPlaceholder')}
              value={tag}
              onChangeText={(value) => setTag(value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={GUILD_LIMITS.tagMax}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Field
              label={t('fieldDesc')}
              placeholder={t('fieldDescPlaceholder')}
              value={description}
              onChangeText={setDescription}
              maxLength={GUILD_LIMITS.descMax}
              multiline
            />

            {validationHint && <Text style={ui.hint}>{validationHint}</Text>}
            <FeedbackLine feedback={feedback} />

            <KsButton
              label={`${t('createSubmit')} · ${formatCoins(createCost)}`}
              tone="alert"
              filled
              disabled={!canSubmit}
              busy={create.isPending}
              onPress={handleCreate}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const local = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { flex: 1, minHeight: 40 },
  sheet: {
    flexShrink: 1,
    backgroundColor: KS.bg,
    borderTopWidth: 1,
    borderColor: KS.hairSoft,
  },
  content: { padding: 20, paddingBottom: 0, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.32,
  },
  title: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.titleMd,
    letterSpacing: SIZES.titleMd * 0.08,
    marginTop: 2,
  },
  closeBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KS.surface,
  },
  closeText: { color: KS.inkMute, fontFamily: TYPO.mono, fontSize: SIZES.monoLg },
  costLine: {
    color: KS.ink,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.14,
  },
});
