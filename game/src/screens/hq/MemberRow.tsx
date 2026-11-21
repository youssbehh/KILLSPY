import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { ChamferContainer, HexAvatar } from '../../components/ks';
import { GuildMemberDTO, GuildRole } from '../../api/guilds';
import { rankTierName } from '../../game/rankDisplay';
import { useHqT } from './strings';
import { ConfirmButton, KsButton, ROLE_COLOR, ROLE_KEY, styles as ui, tint } from './ui';

export type MemberAction = 'promote' | 'demote' | 'transfer' | 'kick';

/** What `myRole` may do to `target`. Nobody acts on themself; only a transfer touches the leader seat. */
export const allowedActions = (myRole: GuildRole, target: GuildMemberDTO, isMe: boolean): MemberAction[] => {
  if (isMe || target.role === 'LEADER') return [];
  if (myRole === 'LEADER') {
    return [target.role === 'OFFICER' ? 'demote' : 'promote', 'transfer', 'kick'];
  }
  if (myRole === 'OFFICER' && target.role === 'MEMBER') return ['kick'];
  return [];
};

interface Props {
  member: GuildMemberDTO;
  isMe: boolean;
  actions: MemberAction[];
  expanded: boolean;
  /** Action currently being sent for this member, if any. */
  pendingAction: MemberAction | null;
  disabled: boolean;
  width: number;
  onToggle: () => void;
  onAction: (action: MemberAction) => void;
}

const ROW_HEIGHT = 56;

export const MemberRow: React.FC<Props> = ({
  member, isMe, actions, expanded, pendingAction, disabled, width, onToggle, onAction,
}) => {
  const t = useHqT();
  const roleColor = ROLE_COLOR[member.role];
  const canAct = actions.length > 0;

  const row = (
    <ChamferContainer
      width={width}
      height={ROW_HEIGHT}
      chamfer={6}
      variant="tl-br"
      fill={KS.surface}
      stroke={expanded ? KS.hair : KS.hairSoft}
    >
      <View style={local.row}>
        <HexAvatar size={32} tier={rankTierName(member.mmr)} initials={member.username.slice(0, 2)} />
        <View style={local.info}>
          <Text style={ui.rowName} numberOfLines={1}>
            {member.username.toUpperCase()}
            {isMe && <Text style={local.you}>  {t('you')}</Text>}
          </Text>
          <Text style={ui.rowMeta}>{t('mmr', { mmr: member.mmr.toLocaleString('en-US') })}</Text>
        </View>
        <View style={[local.badge, { borderColor: roleColor, backgroundColor: tint(roleColor) }]}>
          <Text style={[local.badgeText, { color: roleColor }]}>{t(ROLE_KEY[member.role])}</Text>
        </View>
        {canAct && <Text style={local.chevron}>{expanded ? '▴' : '▾'}</Text>}
      </View>
    </ChamferContainer>
  );

  if (!canAct) {
    return (
      <View accessible accessibilityLabel={`${member.username}, ${t(ROLE_KEY[member.role])}`}>
        {row}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${t('memberActionsA11y', { name: member.username })}, ${t(ROLE_KEY[member.role])}`}
        accessibilityState={{ expanded }}
      >
        {row}
      </Pressable>
      {expanded && (
        <View style={local.actions}>
          {actions.map((action) => {
            const common = {
              label: t(action),
              a11yLabel: `${t(action)} : ${member.username}`,
              disabled,
              busy: pendingAction === action,
              style: local.action,
            };
            // Kick and transfer are destructive: they need a second tap.
            return action === 'kick' || action === 'transfer' ? (
              <ConfirmButton
                key={action}
                {...common}
                tone={action === 'kick' ? 'danger' : 'alert'}
                onConfirm={() => onAction(action)}
              />
            ) : (
              <KsButton key={action} {...common} tone="primary" onPress={() => onAction(action)} />
            );
          })}
        </View>
      )}
    </View>
  );
};

const local = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  info: { flex: 1 },
  you: { color: KS.live, fontFamily: TYPO.mono, fontSize: SIZES.monoXs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  badgeText: { fontFamily: TYPO.mono, fontSize: SIZES.monoXs, letterSpacing: SIZES.monoXs * 0.18 },
  chevron: { color: KS.inkDim, fontFamily: TYPO.mono, fontSize: SIZES.monoLg },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: KS.hairSoft,
    backgroundColor: KS.glass,
  },
  action: { flexGrow: 1 },
});
