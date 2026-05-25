import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { KSAccordion } from './KSAccordion';
import { KS } from '@/src/theme/colors';
import { TYPO, SIZES } from '@/src/theme/typography';

const SecuriteContainer = () => {
  const { langIndex } = useLanguageStore();
  return (
    <KSAccordion title={motTraduit(langIndex, 21)}>
      <Text style={styles.body}>{motTraduit(langIndex, 69)}</Text>
    </KSAccordion>
  );
};

const styles = StyleSheet.create({
  body: {
    color: KS.inkDim,
    fontFamily: TYPO.ui,
    fontSize: SIZES.body,
    lineHeight: SIZES.body * 1.5,
  },
});

export default SecuriteContainer;
