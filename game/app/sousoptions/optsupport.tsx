import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const SupportContainer = () => {
  const { langIndex } = useLanguageStore();
  return (
    <KSAccordion title={motTraduit(langIndex, 28)}>
      <Text style={styles.label}>{motTraduit(langIndex, 47)} :</Text>
      <Text style={styles.email}>support@killspy.io</Text>
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  label: {
    color: KS.inkDim,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoSm,
    letterSpacing: SIZES.monoSm * 0.14,
  },
  email: {
    color: KS.primary,
    fontFamily: TYPO.mono,
    fontSize: SIZES.monoMd,
    letterSpacing: SIZES.monoMd * 0.14,
    marginTop: 4,
  },
});

export default SupportContainer;
