import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SectionLabel } from '../../components/ks';
import { GuildMemberDTO, GuildRole, MyGuild } from '../../api/guilds';
import { extractApiError } from '../../api/client';
import { useKickMember, useSetMemberRole, useTransferLeadership } from '../../hooks/useGuilds';
import { useHqT } from './strings';
import { InviteForm } from './InviteForm';
import { MemberAction, MemberRow, allowedActions } from './MemberRow';
import { EmptyState, Feedback, FeedbackLine, PAD } from './ui';

interface Props {
  guild: MyGuild;
  myRole: GuildRole;
  myUserId: number | undefined;
  cardWidth: number;
  bottomPad: number;
}

const ROLE_ORDER: Record<GuildRole, number> = { LEADER: 0, OFFICER: 1, MEMBER: 2 };

const sortMembers = (members: GuildMemberDTO[]): GuildMemberDTO[] =>
  [...members].sort(
    (a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.username.localeCompare(b.username),
  );

/** Roster with role-dependent actions, plus the invite form for officers and the leader. */
export const MembersTab: React.FC<Props> = ({ guild, myRole, myUserId, cardWidth, bottomPad }) => {
  const t = useHqT();
  const kick = useKickMember();
  const setRole = useSetMemberRole();
  const transfer = useTransferLeadership();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pending, setPending] = useState<{ userId: number; action: MemberAction } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const members = sortMembers(guild.members ?? []);
  const canInvite = myRole === 'LEADER' || myRole === 'OFFICER';

  const handleAction = (member: GuildMemberDTO, action: MemberAction) => {
    if (pending) return;
    // Re-check against the current roster: roles can change under us through the socket.
    if (!allowedActions(myRole, member, member.userId === myUserId).includes(action)) return;

    setFeedback(null);
    setPending({ userId: member.userId, action });
    const callbacks = {
      onSuccess: () => setExpandedId(null),
      onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
      onSettled: () => setPending(null),
    };
    if (action === 'kick') kick.mutate(member.userId, callbacks);
    else if (action === 'transfer') transfer.mutate(member.userId, callbacks);
    else setRole.mutate({ userId: member.userId, role: action === 'promote' ? 'OFFICER' : 'MEMBER' }, callbacks);
  };

  return (
    <ScrollView
      contentContainerStyle={[local.scroll, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {canInvite && <InviteForm />}

      <SectionLabel label={t('membersSection', { count: members.length })} />
      <FeedbackLine feedback={feedback} />
      {members.length === 0 && <EmptyState text={t('membersEmpty')} />}
      {members.map((member) => {
        const isMe = member.userId === myUserId;
        return (
          <MemberRow
            key={member.userId}
            member={member}
            isMe={isMe}
            actions={allowedActions(myRole, member, isMe)}
            expanded={expandedId === member.userId}
            pendingAction={pending?.userId === member.userId ? pending.action : null}
            disabled={pending !== null}
            width={cardWidth}
            onToggle={() => setExpandedId(expandedId === member.userId ? null : member.userId)}
            onAction={(action) => handleAction(member, action)}
          />
        );
      })}
    </ScrollView>
  );
};

const local = StyleSheet.create({
  scroll: { paddingHorizontal: PAD, paddingTop: 12, gap: 10 },
});
