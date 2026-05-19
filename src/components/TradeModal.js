import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const QUICK_PCTS = [0.25, 0.5, 1.0];

export default function TradeModal({
  visible,
  mode,
  coinData,
  currentPrice,
  holdings,
  credits,
  onConfirm,
  onCancel,
}) {
  const isBuy = mode === 'buy';
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (visible) {
      setInputValue(isBuy ? '1000' : holdings > 0 ? holdings.toFixed(4) : '0');
    }
  }, [visible, isBuy, holdings]);

  const parsed = parseFloat(inputValue) || 0;
  const isValid = isBuy
    ? parsed > 0 && parsed <= credits
    : parsed > 0 && parsed <= holdings;

  const outputAmount = isBuy
    ? currentPrice > 0 ? parsed / currentPrice : 0
    : parsed * currentPrice;

  const outputLine = isBuy
    ? `You will receive: ${outputAmount.toFixed(4)} ${coinData?.symbol || ''}`
    : `You will receive: ${Math.round(outputAmount).toLocaleString()} CR`;

  const accent = isBuy ? colors.primary : colors.secondaryContainer;
  const accentOn = isBuy ? colors.onPrimaryFixed : colors.onSecondaryFixed;

  const handleQuick = (pct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base = isBuy ? credits : holdings;
    const val = base * pct;
    setInputValue(isBuy ? String(Math.floor(val)) : val.toFixed(4));
  };

  const handleConfirm = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(parsed);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <View style={[styles.modal, { borderColor: accent, shadowColor: accent }]}>
          {/* Title bar */}
          <View style={[styles.titleBar, { borderBottomColor: `${accent}44` }]}>
            <Text style={[styles.titleBarText, { color: accent }]}>
              {isBuy
                ? `>>> BUY // ${coinData?.symbol || ''}`
                : `>>> SELL // ${coinData?.symbol || ''}`}
            </Text>
          </View>

          <View style={styles.content}>
            {/* Price row */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>CURRENT_PRICE</Text>
              <Text style={[styles.metaValue, { color: accent }]}>
                {currentPrice.toLocaleString()} CR
              </Text>
            </View>

            {!isBuy && holdings > 0 && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>HOLDINGS</Text>
                <Text style={[styles.metaValue, { color: colors.outline }]}>
                  {holdings.toFixed(4)} {coinData?.symbol}
                </Text>
              </View>
            )}

            {/* Input */}
            <Text style={styles.inputLabel}>
              {isBuy ? 'CREDITS_TO_SPEND' : 'AMOUNT_TO_SELL'}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: accent, selectionColor: accent }]}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              placeholderTextColor={colors.outline}
              placeholder={isBuy ? '1000' : '0.0000'}
            />

            {/* Quick buttons */}
            <View style={styles.quickRow}>
              {QUICK_PCTS.map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.quickBtn, { borderColor: `${accent}55` }]}
                  onPress={() => handleQuick(pct)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickBtnText, { color: accent }]}>
                    {pct === 1.0 ? '100%' : `${pct * 100}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Output */}
            <View style={[styles.outputBox, { borderColor: `${accent}33`, backgroundColor: `${accent}06` }]}>
              <Text style={[styles.outputText, { color: isValid ? accent : colors.outline }]}>
                {outputLine}
              </Text>
            </View>

            {!isValid && parsed > 0 && (
              <Text style={styles.errorText}>
                {isBuy ? '> NO_FUNDS' : '> INSUFFICIENT_HOLDINGS'}
              </Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: isValid ? accent : `${accent}1A`,
                  borderColor: accent,
                },
              ]}
              onPress={handleConfirm}
              activeOpacity={isValid ? 0.8 : 1}
            >
              <Text style={[styles.confirmBtnText, { color: isValid ? accentOn : `${accent}66` }]}>
                {isBuy ? '[CONFIRM_BUY]' : '[CONFIRM_SELL]'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>[CANCEL]</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  titleBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  titleBarText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    padding: 10,
    fontFamily: 'KodeMono_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 7,
    alignItems: 'center',
  },
  quickBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  outputBox: {
    borderWidth: 1,
    padding: 10,
  },
  outputText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttons: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  confirmBtn: {
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.outline,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
