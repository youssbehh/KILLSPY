import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { useBotStore } from '@/src/stores/botStore';
import { BotDifficulty } from '@/src/game/botAI';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const BOT_DIFFICULTIES: { id: BotDifficulty; label: string; desc: string; accent: string }[] = [
  { id: 'easy',   label: 'EASY',   desc: "Bot aléatoire — pour s'entraîner.", accent: KS.live },
  { id: 'medium', label: 'MEDIUM', desc: 'Bot qui mémorise vos patterns.',      accent: KS.alert },
  { id: 'hard',   label: 'HARD',   desc: 'Bot prédictif — il anticipe.',         accent: KS.danger },
];

const DiversContainer = () => {
  const { langIndex } = useLanguageStore();
  const botDifficulty = useBotStore((s) => s.difficulty);
  const setBotDifficulty = useBotStore((s) => s.setDifficulty);

  return (
    <KSAccordion title={motTraduit(langIndex, 22)}>
      {/* Theme info */}
      <Text style={styles.sectionLabel}>🎨 THÈME GRAPHIQUE</Text>
      <Text style={styles.hint}>
        Les thèmes sont des cosmétiques achetables en boutique et équipables depuis l'inventaire.
      </Text>

      <View style={styles.divider} />

      {/* Bot difficulty */}
      <Text style={styles.sectionLabel}>🤖 DIFFICULTÉ DU BOT</Text>
      {BOT_DIFFICULTIES.map((d) => {
        const active = botDifficulty === d.id;
        return (
          <Pressable
            key={d.id}
            onPress={() => setBotDifficulty(d.id)}
            style={[styles.diffRow, active && { borderColor: d.accent, backgroundColor: d.accent + '12' }]}
          >
            <View style={styles.diffTexts}>
              <Text style={[styles.diffLabel, active && { color: d.accent }]}>{d.label}</Text>
              <Text style={styles.diffDesc}>{d.desc}</Text>
            </View>
            {active && <Text style={[styles.check, { color: d.accent }]}>✓</Text>}
          </Pressable>
        );
      })}
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.22,
    marginBottom: 6,
  },
  hint: {
    color: KS.inkFaint,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodySm,
    fontStyle: 'italic',
    lineHeight: SIZES.bodySm * 1.5,
  },
  divider: { height: 1, backgroundColor: KS.divider, marginVertical: 10 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: KS.hairSoft,
    backgroundColor: KS.surface,
  },
  diffTexts: { flex: 1 },
  diffLabel: {
    color: KS.ink,
    fontFamily: TYPO.display,
    fontSize: SIZES.labelLg,
    letterSpacing: SIZES.labelLg * 0.08,
  },
  diffDesc: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.bodySm,
    marginTop: 2,
  },
  check: { fontFamily: TYPO.mono, fontSize: 16 },
});

export default DiversContainer;
