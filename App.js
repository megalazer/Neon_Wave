import './global.css';

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { useFonts } from 'expo-font';
import { fontMap } from './src/theme/fonts';
import { colors } from './src/theme/colors';

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

  const handleTabPress = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Gate render on font load — matches requirement in prompt
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

      {/* Main content area */}
      <View style={styles.flex}>
        <ActiveScreen activeTab={activeTab} />
      </View>

      {/* Fixed overlays — always on top */}
      <TopBanner
        subtitle={subtitle}
        telemetry={{ credits: '1,000', renown: 'GHOST' }}
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
