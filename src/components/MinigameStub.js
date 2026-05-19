import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export default function MinigameStub({ visible, asset, onClose }) {
  if (!asset) return null;

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

        <View style={styles.container}>
          <View style={styles.titleBar}>
            <Text style={styles.titleBarText}>{'>>> MINIGAME_MODULE <<<'}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>
              MINIGAME // {asset.minigame.toUpperCase()}
            </Text>

            <View style={styles.iconWrap}>
              <MaterialIcons name={asset.icon} size={64} color={`${colors.primary}44`} />
            </View>

            <Text style={styles.statusLabel}>[PROTOCOL_NOT_IMPLEMENTED]</Text>
            <Text style={styles.subLabel}>
              // This experience module is queued for future deployment.
            </Text>
            <Text style={styles.flavorLine}>
              {`> Your ${asset.name} awaits. Awaiting authorized program.`}
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <MaterialIcons name="close" size={14} color={colors.primary} />
            <Text style={styles.closeBtnText}>[CLOSE_PROTOCOL]</Text>
          </TouchableOpacity>
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
  },
  container: {
    width: '86%',
    maxWidth: 360,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  titleBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}44`,
    alignItems: 'center',
  },
  titleBarText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    backgroundColor: `${colors.primary}06`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subLabel: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: `${colors.outline}88`,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  flavorLine: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: `${colors.primary}66`,
    letterSpacing: 0.5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    paddingVertical: 13,
  },
  closeBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
