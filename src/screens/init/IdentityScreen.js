import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { HANDLES } from '../../data/handles';
import { colors } from '../../theme/colors';
import InitHeader from '../../components/init/InitHeader';
import InitFooter from '../../components/init/InitFooter';

const HEADER_H = 90;

export default function IdentityScreen({ draft, onSetName, onBack, onContinue }) {
  const canContinue = draft.name.trim().length > 0;

  const promptText = draft.name.trim()
    ? `> HANDLE_REGISTERED: ${draft.name}`
    : '> HANDLE_REQUIRED';

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const handle = HANDLES[Math.floor(Math.random() * HANDLES.length)];
    onSetName(handle);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <InitHeader step={2} stepLabel="IDENTITY" />

      <Text style={styles.decalL} pointerEvents="none">NEURAL_VOID</Text>
      <Text style={styles.decalR} pointerEvents="none">OVERWRITE_CMD</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Handle section */}
        <View style={styles.section}>
          <View style={styles.sectionBar}>
            <Text style={styles.sectionLabel}>[OPERATOR_HANDLE]</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={draft.name}
            onChangeText={(text) => onSetName(text.toUpperCase())}
            placeholder="ENTER_DESIGNATION..."
            placeholderTextColor={colors.outline}
            selectionColor={colors.primary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={24}
          />
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.75}>
            <MaterialIcons name="shuffle" size={12} color={colors.primary} />
            <Text style={styles.generateTxt}>GENERATE_HANDLE</Text>
          </TouchableOpacity>
        </View>

        {/* Prompt */}
        <View style={styles.prompt}>
          <Text
            style={[
              styles.promptText,
              { color: draft.name.trim() ? colors.primary : colors.outline },
            ]}
          >
            {promptText}
          </Text>
        </View>

        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backLink}>← BACK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnOff]}
            onPress={() => {
              if (!canContinue) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onContinue();
            }}
            activeOpacity={canContinue ? 0.75 : 1}
          >
            <Text style={[styles.continueTxt, !canContinue && styles.continueTxtOff]}>
              CONTINUE →
            </Text>
          </TouchableOpacity>
        </View>

        <InitFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: {
    paddingTop: HEADER_H + 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 20,
  },
  decalL: {
    position: 'absolute',
    left: -48,
    top: '38%',
    transform: [{ rotate: '-90deg' }],
    fontFamily: 'KodeMono_700Bold',
    fontSize: 30,
    color: colors.primary,
    opacity: 0.04,
    letterSpacing: 8,
    zIndex: 0,
  },
  decalR: {
    position: 'absolute',
    right: -72,
    top: '28%',
    transform: [{ rotate: '90deg' }],
    fontFamily: 'KodeMono_700Bold',
    fontSize: 26,
    color: colors.secondaryContainer,
    opacity: 0.04,
    letterSpacing: 6,
    zIndex: 0,
  },
  section: { gap: 8 },
  sectionBar: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.secondary}33`,
    paddingBottom: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.secondaryContainer,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  nameInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 14,
    fontFamily: 'KodeMono_400Regular',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: 1,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  generateTxt: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  prompt: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
    backgroundColor: `${colors.primary}06`,
  },
  promptText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  continueBtnOff: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${colors.outline}55`,
  },
  continueTxt: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.onPrimary,
    textTransform: 'uppercase',
  },
  continueTxtOff: { color: `${colors.outline}55` },
});
