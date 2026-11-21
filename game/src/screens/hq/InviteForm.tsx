import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { KS } from '../../theme/colors';
import { SectionLabel } from '../../components/ks';
import { extractApiError } from '../../api/client';
import { useInvitePlayer } from '../../hooks/useGuilds';
import { useHqT } from './strings';
import { Feedback, FeedbackLine, KsButton, styles as ui } from './ui';

const USERNAME_MAX = 32;

/** Officers and the leader invite a player by username. */
export const InviteForm: React.FC = () => {
  const t = useHqT();
  const invite = useInvitePlayer();
  const [username, setUsername] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);

  const target = username.trim();

  const handleInvite = () => {
    if (!target || invite.isPending) return;
    setFeedback(null);
    invite.mutate(target, {
      onSuccess: () => {
        setFeedback({ text: t('inviteSent', { name: target }), ok: true });
        setUsername('');
      },
      onError: (e: unknown) => setFeedback({ text: extractApiError(e).message, ok: false }),
    });
  };

  return (
    <View style={local.section}>
      <SectionLabel label={t('inviteSection')} color={KS.live} />
      <View style={local.row}>
        <TextInput
          style={[ui.input, local.input]}
          placeholder={t('invitePlaceholder')}
          placeholderTextColor={KS.inkFaint}
          accessibilityLabel={t('inviteA11y')}
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={handleInvite}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          maxLength={USERNAME_MAX}
        />
        <KsButton
          label={t('inviteSend')}
          tone="live"
          disabled={!target}
          busy={invite.isPending}
          onPress={handleInvite}
        />
      </View>
      <FeedbackLine feedback={feedback} />
    </View>
  );
};

const local = StyleSheet.create({
  section: { gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1 },
});
