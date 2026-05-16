import {
  KodeMono_400Regular,
  KodeMono_500Medium,
  KodeMono_600SemiBold,
  KodeMono_700Bold,
} from '@expo-google-fonts/kode-mono';

export const fontMap = {
  KodeMono_400Regular,
  KodeMono_500Medium,
  KodeMono_600SemiBold,
  KodeMono_700Bold,
};

// Style objects for font usage in StyleSheet.create
export const fontStyles = {
  regular: { fontFamily: 'KodeMono_400Regular' },
  medium: { fontFamily: 'KodeMono_500Medium' },
  semibold: { fontFamily: 'KodeMono_600SemiBold' },
  bold: { fontFamily: 'KodeMono_700Bold' },
};

// Label caps = uppercase + letter spacing + bold Kode Mono
export const labelCaps = {
  fontFamily: 'KodeMono_700Bold',
  fontSize: 12,
  lineHeight: 12,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};

export const bodyMd = {
  fontFamily: 'KodeMono_400Regular',
  fontSize: 14,
  lineHeight: 22,
};

export const headlineMd = {
  fontFamily: 'KodeMono_700Bold',
  fontSize: 24,
  lineHeight: 31,
};
