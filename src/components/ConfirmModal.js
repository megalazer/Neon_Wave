import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';

const VARIANT_COLORS = {
  destructive: {
    border: colors.error,
    labelText: colors.error,
    glow: 'rgba(255,180,171,0.4)',
    confirmBg: colors.error,
    confirmText: colors.onError,
  },
  neutral: {
    border: colors.primary,
    labelText: colors.primary,
    glow: 'rgba(0,243,255,0.3)',
    confirmBg: colors.primary,
    confirmText: colors.onPrimaryContainer,
  },
};

function ModalButton({ label, fillColor, textColor, borderColor, onPress }) {
  const pressed = useSharedValue(0);

  const containerAnim = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(0,0,0,0)', fillColor]),
  }));
  const textAnim = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], [borderColor, textColor]),
  }));

  return (
    <Animated.View style={[styles.button, { borderColor }, containerAnim]}>
      <TouchableOpacity
        onPressIn={() => { pressed.value = withTiming(1, { duration: 75 }); }}
        onPressOut={() => { pressed.value = withTiming(0, { duration: 75 }); }}
        onPress={onPress}
        activeOpacity={1}
        style={styles.buttonInner}
      >
        <Animated.Text style={[styles.buttonText, textAnim]}>{label}</Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ConfirmModal({
  visible,
  variant = 'destructive',
  title,
  body,
  warning,
  confirmLabel = '[CONFIRM]',
  cancelLabel = '[CANCEL]',
  onConfirm,
  onCancel,
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    } else {
      opacity.value = 0;
      scale.value = 0.95;
    }
  }, [visible]);

  const v = VARIANT_COLORS[variant] || VARIANT_COLORS.destructive;

  const backdropAnim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const containerAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      {/* Blurred backdrop — tappable to cancel */}
      <Animated.View style={[styles.backdrop, backdropAnim]} pointerEvents="box-none">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />
      </Animated.View>

      {/* Centered modal box */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.modal,
            {
              borderColor: v.border,
              shadowColor: v.border,
            },
            containerAnim,
          ]}
        >
          {/* Subtle noise texture */}
          <View style={styles.noiseOverlay} />

          {/* Label strip */}
          <View style={[styles.labelStrip, { borderBottomColor: `${v.border}66` }]}>
            <Text style={[styles.labelStripText, { color: v.labelText }]}>
              {'>>> CONFIRMATION_REQUIRED <<<'}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            {warning ? (
              <Text style={styles.warning}>{`> WARNING: ${warning}`}</Text>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={styles.buttons}>
            <ModalButton
              label={confirmLabel}
              fillColor={v.confirmBg}
              textColor={v.confirmText}
              borderColor={v.border}
              onPress={handleConfirm}
            />
            <ModalButton
              label={cancelLabel}
              fillColor={colors.surfaceContainerHigh}
              textColor={colors.onSurface}
              borderColor={colors.outline}
              onPress={handleCancel}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(229,225,228,0.02)',
    zIndex: 0,
  },
  labelStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  labelStripText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  warning: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.error,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  buttons: {
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
  button: {
    borderWidth: 1,
  },
  buttonInner: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
