import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { KS } from '../../theme/colors';
import { SectionLabel } from '../../components/ks';
import { GuildInviteDTO } from '../../api/guilds';
import { extractApiError } from '../../api/client';
import { useAcceptInvite, useDeclineInvite, useMyGuildInvites } from '../../hooks/useGuilds';
import { useHqT } from './strings';
import {
  EmptyState, ErrorState, Feedback, FeedbackLine, KsButton, LoadingState, TagChip, styles as ui,
} from './ui';

/** Invitations the player received, with accept / decline. */
export const InvitesSection: React.FC = () => {
  const t = useHqT();
  const { data, isLoading, isError, refetch } = useMyGuildInvites();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const [pending, setPending] = useState<{ id: number; action: 'accept' | 'decline' } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const invites: GuildInviteDTO[] = data ?? [];
  const busy = pending !== null;

  const run = (invite: GuildInviteDTO, action: 'accept' | 'decline') => {
    setFeedback(null);
    setPending({ id: invite.id, action });
    const callbacks = {
      onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
      onSettled: () => setPending(null),
    };
    if (action === 'accept') accept.mutate(invite.id, callbacks);
    else decline.mutate(invite.id, callbacks);
  };

  return (
    <View style={local.section}>
      <SectionLabel label={t('invitesSection', { count: invites.length })} color={KS.alert} />
      <FeedbackLine feedback={feedback} />
      {isLoading && <LoadingState />}
      {isError && <ErrorState text={t('invitesError')} onRetry={() => refetch()} />}
      {!isLoading && !isError && invites.length === 0 && <EmptyState text={t('invitesEmpty')} />}
      {invites.map((invite) => (
        <View key={invite.id} style={local.card}>
          <View style={local.top}>
            <TagChip tag={invite.guild.tag} color={KS.alert} />
            <View style={local.info}>
              <Text style={ui.rowName} numberOfLines={1}>{invite.guild.name}</Text>
              <Text style={ui.rowMeta} numberOfLines={1}>
                {t('invitedBy', { name: invite.invitedBy })}
                {' · '}
                {t('membersCount', { count: invite.guild.memberCount, max: invite.guild.maxMembers })}
              </Text>
            </View>
          </View>
          <View style={local.actions}>
            <KsButton
              label={t('decline')}
              a11yLabel={t('declineA11y', { guild: invite.guild.name })}
              tone="neutral"
              disabled={busy}
              busy={pending?.id === invite.id && pending.action === 'decline'}
              onPress={() => run(invite, 'decline')}
              style={local.action}
            />
            <KsButton
              label={t('accept')}
              a11yLabel={t('acceptA11y', { guild: invite.guild.name })}
              tone="live"
              disabled={busy}
              busy={pending?.id === invite.id && pending.action === 'accept'}
              onPress={() => run(invite, 'accept')}
              style={local.action}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const local = StyleSheet.create({
  section: { gap: 10 },
  card: {
    backgroundColor: KS.surface,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    padding: 12,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
