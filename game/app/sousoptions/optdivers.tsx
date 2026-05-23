import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { motTraduit } from '@/components/translationHelper';
import { useLanguageStore } from '../../store/languageStore';
import { FontAwesomeWrapper } from '@/components/FontAwesomeWrapper';
import { faCaretDown, faCaretUp, faPalette, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useThemeStore } from '@/src/stores/themeStore';
import { themes, THEME_IDS, ThemeId } from '@/src/theme/themes';
import { useBotStore } from '@/src/stores/botStore';
import { BotDifficulty } from '@/src/game/botAI';

interface DiversParamProps {
  title: string;
  children: React.ReactNode;
}

const DiversParam: React.FC<DiversParamProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <FontAwesomeWrapper icon={isOpen ? faCaretUp : faCaretDown} />
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const ThemeSwatch: React.FC<{ themeId: ThemeId; active: boolean; onPress: () => void }> = ({
  themeId,
  active,
  onPress,
}) => {
  const theme = themes[themeId];
  return (
    <Pressable onPress={onPress} style={[styles.swatchRow, active && styles.swatchActive]}>
      <View style={styles.swatchPreview}>
        <View style={[styles.swatchDot, { backgroundColor: theme.colors.background }]} />
        <View style={[styles.swatchDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.swatchDot, { backgroundColor: theme.colors.accent }]} />
      </View>
      <Text style={styles.swatchLabel}>{theme.fallbackLabel}</Text>
      {active ? <FontAwesomeWrapper icon={faCheck} /> : null}
    </Pressable>
  );
};

const BOT_DIFFICULTIES: { id: BotDifficulty; label: string; description: string }[] = [
  { id: 'easy', label: 'Facile', description: 'Bot aléatoire — pour s\'entraîner.' },
  { id: 'medium', label: 'Moyen', description: 'Bot qui mémorise vos patterns.' },
  { id: 'hard', label: 'Difficile', description: 'Bot prédictif — il anticipe.' },
];

const DiversContainer = () => {
  const { langIndex } = useLanguageStore();
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const botDifficulty = useBotStore((s) => s.difficulty);
  const setBotDifficulty = useBotStore((s) => s.setDifficulty);

  return (
    <View>
      <DiversParam title={motTraduit(langIndex, 22)}>
        <View style={styles.themeHeader}>
          <FontAwesomeWrapper icon={faPalette} />
          <Text style={styles.themeHeaderText}>Thème graphique</Text>
        </View>
        {THEME_IDS.map((id) => (
          <ThemeSwatch
            key={id}
            themeId={id}
            active={themeId === id}
            onPress={() => setTheme(id)}
          />
        ))}

        <View style={styles.divider} />

        <Text style={styles.themeHeaderText}>Difficulté du bot</Text>
        {BOT_DIFFICULTIES.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setBotDifficulty(d.id)}
            style={[styles.diffRow, botDifficulty === d.id && styles.diffActive]}
          >
            <View style={styles.diffTexts}>
              <Text style={styles.diffLabel}>{d.label}</Text>
              <Text style={styles.diffDesc}>{d.description}</Text>
            </View>
            {botDifficulty === d.id ? <FontAwesomeWrapper icon={faCheck} /> : null}
          </Pressable>
        ))}
      </DiversParam>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f1f1f1' },
  title: { fontSize: 16 },
  content: { padding: 10, backgroundColor: '#fff' },
  themeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  themeHeaderText: { fontSize: 14, fontWeight: '600' },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  swatchActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  swatchPreview: { flexDirection: 'row', gap: 4 },
  swatchDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  swatchLabel: { flex: 1, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 16 },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  diffActive: { borderColor: '#007AFF', backgroundColor: '#f0f7ff' },
  diffTexts: { flex: 1 },
  diffLabel: { fontSize: 14, fontWeight: '600' },
  diffDesc: { fontSize: 12, color: '#666' },
});

export default DiversContainer;
