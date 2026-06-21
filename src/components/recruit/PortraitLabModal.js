import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import PortraitPreview from './PortraitPreview';
import { generateRecruit } from '../../engine/recruitGenerator';

const LAB_CLASSES = [
  ['ANY', null],
  ['NETRUNNER', 'netrunner'],
  ['STREET SAMURAI', 'street_samurai'],
  ['FIXER', 'fixer'],
  ['GHOST', 'ghost'],
  ['CHROME DOC', 'chrome_doc'],
];

export default function PortraitLabModal({
  visible,
  onClose,
  completedContracts,
  currentTurn,
}) {
  const [labPerson, setLabPerson] = useState(null);
  const [labClass, setLabClass] = useState(null);

  const handleGeneratePerson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const recruit = generateRecruit(
      completedContracts,
      currentTurn,
      undefined,
      labClass || undefined,
    );
    setLabPerson({ character: recruit, portrait: recruit.portrait });
  }, [completedContracts, currentTurn, labClass]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.panel}>
          {/* Title strip */}
          <View style={styles.titleBar}>
            <Text style={styles.titleBarText}>
              {'>>> PORTRAIT_LAB <<<'}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeBtn}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            LAYER_STACK_TEST_RIG // LOCAL_PREVIEW
          </Text>

          {/* Class chips */}
          <View style={styles.chipRow}>
            {LAB_CLASSES.map(([label, key]) => {
              const active = labClass === key;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setLabClass(key)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Generate button */}
          <TouchableOpacity style={styles.generateBtn} onPress={handleGeneratePerson}>
            <Text style={styles.generateBtnText}>[GENERATE_PERSON]</Text>
          </TouchableOpacity>

          {/* Generated result in scroll */}
          {labPerson && (
            <ScrollView
              style={styles.resultScroll}
              contentContainerStyle={styles.resultContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.previewWrap}>
                <PortraitPreview
                  size={null}
                  character={labPerson.character}
                  portrait={labPerson.portrait}
                  borderColor={colors.tertiaryContainer}
                  backgroundColor={colors.background}
                  style={styles.preview}
                />
              </View>
              <Text style={styles.labName}>
                {labPerson.character.name} · {labPerson.character.handle}
              </Text>
              <Text style={styles.labMeta}>
                {String(labPerson.character.class).toUpperCase()}
              </Text>
              <View style={styles.tierRow}>
                <Text style={styles.tierChip}>
                  RECRUIT {String(labPerson.character.quality).toUpperCase()}
                </Text>
                <Text style={styles.tierChip}>
                  PORTRAIT {String(labPerson.portrait.tier).toUpperCase()}
                </Text>
              </View>
              {labPerson.portrait.layers.map((l) => (
                <Text key={l.layer} style={styles.layerRow}>
                  {l.layer} · {l.rarity} · {l.asset}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  panel: {
    width: '90%',
    maxWidth: 420,
    maxHeight: '86%',
    borderWidth: 2,
    borderColor: colors.tertiaryContainer,
    backgroundColor: colors.surfaceContainerLow,
    overflow: 'hidden',
    shadowColor: colors.tertiaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.tertiaryContainer}44`,
  },
  titleBarText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.tertiaryContainer,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: `${colors.onSurfaceVariant}66`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(28,27,29,0.6)',
  },
  chipActive: {
    borderColor: colors.tertiaryContainer,
    backgroundColor: `${colors.tertiaryContainer}14`,
  },
  chipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chipTextActive: {
    color: colors.tertiaryContainer,
  },
  generateBtn: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.tertiaryContainer,
    borderRadius: 0,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: `${colors.tertiaryContainer}10`,
    marginBottom: 16,
  },
  generateBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.tertiaryContainer,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  resultScroll: {
    flexShrink: 1,
    marginBottom: 8,
  },
  resultContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 6,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  preview: {
    width: '100%',
    maxWidth: 260,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  labName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    letterSpacing: 1,
    textAlign: 'center',
  },
  labMeta: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  tierChip: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.tertiaryContainer,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 6,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  layerRow: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
