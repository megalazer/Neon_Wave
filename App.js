import './global.css';

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useFonts } from 'expo-font';
import { fontMap } from './src/theme/fonts';
import { colors } from './src/theme/colors';
import { useStore } from './src/store/index';

import CRTBackground from './src/components/CRTBackground';
import ScanlineOverlay from './src/components/ScanlineOverlay';
import NoiseTexture from './src/components/NoiseTexture';
import TopBanner from './src/components/TopBanner';
import BottomNav from './src/components/BottomNav';

import LogScreen from './src/screens/LogScreen';
import HavenScreen from './src/screens/HavenScreen';
import CyberScreen from './src/screens/CyberScreen';
import JobsScreen from './src/screens/JobsScreen';
import LifestyleScreen from './src/screens/LifestyleScreen';

const SCREEN_SUBTITLES = {
  neural: 'NEURAL_LOG',
  haven: 'HAVEN',
  cyber: 'CYBERWARE',
  jobs: 'CONTRACTS',
  lifestyle: 'LIFESTYLE',
};

function fmtCredits(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(Math.floor(n / 100) / 10).toFixed(1)}K`;
  return String(n);
}

function ActiveScreen({ activeTab }) {
  switch (activeTab) {
    case 'neural': return <LogScreen />;
    case 'haven': return <HavenScreen />;
    case 'cyber': return <CyberScreen />;
    case 'jobs': return <JobsScreen />;
    case 'lifestyle': return <LifestyleScreen />;
    default: return <LogScreen />;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [activeTab, setActiveTab] = useState('neural');
  const credits = useStore((s) => s.character.credits);
  const renown = useStore((s) => s.character.renown);
  const initializeOperatives = useStore((s) => s.initializeOperatives);

  useEffect(() => {
    initializeOperatives();
  }, []);

  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      </View>
    );
  }

  const subtitle = SCREEN_SUBTITLES[activeTab] || '';

  return (
    <CRTBackground>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.flex}>
        <ActiveScreen activeTab={activeTab} />
      </View>

      <TopBanner
        subtitle={subtitle}
        telemetry={{ credits: fmtCredits(credits), renown }}
      />
      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
      <NoiseTexture />
      <ScanlineOverlay />
    </CRTBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
