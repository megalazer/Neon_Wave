import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const MAG = colors.secondaryContainer;

const ICON_MAP = {
  QUICK_STRIKE: 'flash_on',
  OVERLOAD:     'electric_bolt',
  SYSTEM_CRASH: 'warning',
};

export default function CommandButton({ action, cost, cyberPool, rolling, isFocused, onPress }) {
  const canAct = cyberPool >= cost && !rolling;
  const disabled = !canAct;
  const filled = isFocused && !rolling && !disabled;

  const label = disabled && cyberPool < cost
    ? `[NEED_${cost}_CYBER]`
    : action.replace('_', '\n');

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        filled ? styles.btnFilled : styles.btnResting,
        disabled && !filled && styles.btnDisabled,
      ]}
      onPress={canAct ? onPress : undefined}
      activeOpacity={canAct ? 0.75 : 1}
    >
      <MaterialIcons
        name={ICON_MAP[action] || 'flash_on'}
        size={22}
        color={filled ? colors.onSecondaryFixed : disabled ? `${MAG}44` : MAG}
      />
      <Text style={[styles.label, filled && styles.labelFilled, disabled && styles.labelDisabled]}>
        {action}
      </Text>
      <Text style={[styles.cost, filled && styles.costFilled, disabled && styles.costDisabled]}>
        ({cost})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 80,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  btnResting: {
    borderColor: `${MAG}88`,
    backgroundColor: `${MAG}0D`,
  },
  btnFilled: {
    borderColor: MAG,
    backgroundColor: MAG,
    shadowColor: MAG,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: MAG,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  labelFilled: {
    color: colors.onSecondaryFixed,
  },
  labelDisabled: {
    color: `${MAG}44`,
  },
  cost: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${MAG}AA`,
    letterSpacing: 0.5,
  },
  costFilled: {
    color: `${colors.onSecondaryFixed}CC`,
  },
  costDisabled: {
    color: `${MAG}33`,
  },
});
