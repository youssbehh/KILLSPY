import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KS } from '../../theme/colors';
import { TYPO, SIZES } from '../../theme/typography';
import { SectionLabel } from '../../components/ks/SectionLabel';
import { useReportPlayer } from '../../hooks/useFriends';
import { extractApiError } from '../../api/client';
import { REPORT_REASONS, ReportReason } from '../../api/friends';
import { useFriendsT } from './strings';
import { ActionButton, Feedback, PlayerRef, TOUCH } from './ui';

const MAX_DETAILS = 500;

export const ReportForm: React.FC<{ player: PlayerRef; onCancel: () => void }> = ({ player, onCancel }) => {
  const t = useFriendsT();
  const report = useReportPlayer();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (report.isSuccess) return <Feedback text={t('reportSent')} ok />;

  const handleSubmit = () => {
    if (!reason) return;
    setError(null);
    report.mutate(
      { targetId: player.id, reason, details: details.trim() || undefined },
      { onError: (e) => setError(extractApiError(e).message) },
    );
  };

  return (
    <View style={styles.form}>
      <SectionLabel label={t('reportTitle', { name: player.username })} color={KS.alert} />
      <Text style={styles.label}>{t('reportReason')}</Text>
      <View style={styles.reasons} accessibilityRole="radiogroup">
        {REPORT_REASONS.map((value) => {
          const selected = reason === value;
          return (
            <Pressable
              key={value}
              onPress={() => setReason(value)}
              accessibilityRole="radio"
              accessibilityLabel={t(`reason_${value}`)}
              accessibilityState={{ selected, checked: selected }}
              style={[styles.reason, selected && styles.reasonOn]}
            >
              <Text style={[styles.reasonText, selected && { color: KS.ink }]}>{t(`reason_${value}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.details}
        value={details}
        onChangeText={setDetails}
        placeholder={t('reportDetails')}
        placeholderTextColor={KS.inkDim}
        accessibilityLabel={t('reportDetails')}
        multiline
        maxLength={MAX_DETAILS}
      />
      <Feedback text={error} />
      <View style={styles.buttons}>
        <ActionButton label={t('cancel')} tone="neutral" onPress={onCancel} disabled={report.isPending} />
        <View style={styles.grow}>
          <ActionButton
            label={t('reportSubmit')}
            tone="danger"
            block
            disabled={!reason}
            busy={report.isPending}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 10, marginTop: 6 },
  label: { fontFamily: TYPO.mono, fontSize: SIZES.monoMd, color: KS.inkDim },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: {
    minHeight: TOUCH,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    backgroundColor: KS.surface,
    justifyContent: 'center',
  },
  reasonOn: { borderColor: KS.alert, backgroundColor: KS.surfaceHi },
  reasonText: { fontFamily: TYPO.ui, fontSize: SIZES.body, color: KS.inkMute },
  details: {
    minHeight: 72,
    maxHeight: 140,
    backgroundColor: KS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    color: KS.ink,
    textAlignVertical: 'top',
  },
  buttons: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
});
