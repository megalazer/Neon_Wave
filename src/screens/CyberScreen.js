import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function CyberScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.placeholder}>[ CYBER ]</Text>
        <Text style={styles.sub}>// PROTOCOL_OFFLINE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  placeholder: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 22,
    color: colors.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(254,0,254,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sub: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
});
