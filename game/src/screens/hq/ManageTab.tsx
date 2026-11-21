import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KS } from '../../theme/colors';
import { SectionLabel } from '../../components/ks';
import { GuildRole, MyGuild } from '../../api/guilds';
import { extractApiError } from '../../api/client';
import { useDissolveGuild, useLeaveGuild, useUpdateGuild } from '../../hooks/useGuilds';
import { GUILD_LIMITS, isValidGuildName, useHqT } from './strings';
import {
  ConfirmButton, Feedback, FeedbackLine, Field, KsButton, MIN_TOUCH, PAD, styles as ui, tint,
} from './ui';

interface Props {
  guild: MyGuild;
  myRole: GuildRole;
  bottomPad: number;
}

/** Leader settings (name, description, recruitment, dissolve) and the "leave" action for everyone. */
export const ManageTab: React.FC<Props> = ({ guild, myRole, bottomPad }) => {
  const t = useHqT();
  const update = useUpdateGuild();
  const leave = useLeaveGuild();
  const dissolve = useDissolveGuild();
  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description ?? '');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [dangerFeedback, setDangerFeedback] = useState<Feedback>(null);
  const [pendingField, setPendingField] = useState<'details' | 'access' | null>(null);

  const isLeader = myRole === 'LEADER';
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const isDirty = trimmedName !== guild.name || trimmedDescription !== (guild.description ?? '');
  const busy = update.isPending || leave.isPending || dissolve.isPending;

  const handleError = (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false });
  const handleDangerError = (e: unknown) =>
    setDangerFeedback({ text: extractApiError(e).message, ok: false });

  const handleSave = () => {
    setFeedback(null);
    setPendingField('details');
    update.mutate(
      { name: trimmedName, description: trimmedDescription || null },
      {
        onSuccess: () => setFeedback({ text: t('settingsSaved'), ok: true }),
        onError: handleError,
        onSettled: () => setPendingField(null),
      },
    );
  };

  const handleToggleAccess = () => {
    if (busy) return;
    setFeedback(null);
    setPendingField('access');
    update.mutate(
      { isOpen: !guild.isOpen },
      { onError: handleError, onSettled: () => setPendingField(null) },
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[local.scroll, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {isLeader && (
        <>
          <SectionLabel label={t('settingsSection')} />
          <Field label={t('settingsName')} value={name} onChangeText={setName} maxLength={GUILD_LIMITS.nameMax} />
          <Field
            label={t('settingsDesc')}
            value={description}
            onChangeText={setDescription}
            maxLength={GUILD_LIMITS.descMax}
            multiline
          />
          {!isValidGuildName(name) && <Text style={ui.hint}>{t('errName')}</Text>}
          <KsButton
            label={t('settingsSave')}
            tone="primary"
            filled
            disabled={!isDirty || !isValidGuildName(name) || busy}
            busy={pendingField === 'details'}
            onPress={handleSave}
          />

          <SectionLabel label={t('accessSection')} />
          <Pressable
            onPress={handleToggleAccess}
            disabled={busy}
            accessibilityRole="switch"
            accessibilityLabel={t('accessToggleA11y')}
            accessibilityState={{ checked: guild.isOpen, disabled: busy, busy: pendingField === 'access' }}
            style={[local.toggle, pendingField === 'access' && local.toggleBusy]}
          >
            <View style={local.toggleText}>
              <Text style={ui.rowName}>{guild.isOpen ? t('accessOpen') : t('accessClosed')}</Text>
              <Text style={ui.hint}>{guild.isOpen ? t('accessOpenHint') : t('accessClosedHint')}</Text>
            </View>
            <View style={[local.track, guild.isOpen && local.trackOn]}>
              <View style={[local.knob, guild.isOpen && local.knobOn]} />
            </View>
          </Pressable>
          <FeedbackLine feedback={feedback} />
        </>
      )}

      <SectionLabel label={t('dangerSection')} color={KS.danger} />
      {isLeader && <Text style={ui.hint}>{t('leaveHintLeader')}</Text>}
      <ConfirmButton
        label={t('leave')}
        disabled={busy}
        busy={leave.isPending}
        onConfirm={() => {
          setDangerFeedback(null);
          leave.mutate(undefined, { onError: handleDangerError });
        }}
      />
      {isLeader && (
        <>
          <Text style={ui.hint}>{t('dissolveHint')}</Text>
          <ConfirmButton
            label={t('dissolve')}
            disabled={busy}
            busy={dissolve.isPending}
            onConfirm={() => {
              setDangerFeedback(null);
              dissolve.mutate(undefined, { onError: handleDangerError });
            }}
          />
        </>
      )}
      <FeedbackLine feedback={dangerFeedback} />
    </ScrollView>
  );
};

const KNOB = 20;

const local = StyleSheet.create({
  scroll: { paddingHorizontal: PAD, paddingTop: 12, gap: 10 },
  toggle: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
  },
  toggleBusy: { opacity: 0.5 },
  toggleText: { flex: 1, gap: 2 },
  track: {
    width: KNOB * 2 + 6,
    height: KNOB + 6,
    padding: 2,
    borderWidth: 1,
    borderColor: KS.inkFaint,
    backgroundColor: KS.bg,
  },
  trackOn: { borderColor: KS.live, backgroundColor: tint(KS.live) },
  knob: { width: KNOB, height: KNOB, backgroundColor: KS.inkDim },
  knobOn: { backgroundColor: KS.live, alignSelf: 'flex-end' },
});
