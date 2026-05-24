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

import PathScreen from './src/screens/init/PathScreen';
import IdentityScreen from './src/screens/init/IdentityScreen';
import FinalizeScreen from './src/screens/init/FinalizeScreen';
import DevPanel from './src/screens/DevPanel';
import BattleScreen from './src/screens/BattleScreen';
import LevelUpBanner from './src/components/LevelUpBanner';
import ChoiceModal from './src/components/ChoiceModal';

const SCREEN_SUBTITLES = {
  neural: 'NEURAL_LOG',
  haven: 'HAVEN',
  cyber: 'CYBERWARE',
  jobs: 'CONTRACTS',
  lifestyle: 'LIFESTYLE',
};

const INIT_DRAFT_DEFAULT = {
  path: null,
  gender: null,
  name: '',
  starterCyberware: 'starter_neural_link',
};

function fmtCredits(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(Math.floor(n / 100) / 10).toFixed(1)}K`;
  return String(n);
}

function ActiveScreen({ activeTab, onNavigate }) {
  switch (activeTab) {
    case 'neural':    return <LogScreen />;
    case 'haven':     return <HavenScreen />;
    case 'cyber':     return <CyberScreen />;
    case 'jobs':      return <JobsScreen onNavigate={onNavigate} />;
    case 'lifestyle': return <LifestyleScreen />;
    default:          return <LogScreen />;
  }
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [activeTab, setActiveTab] = useState('neural');
  const [battleActive, setBattleActive] = useState(false);
  const [initStep, setInitStep] = useState(1);
  const [initDraft, setInitDraft] = useState(INIT_DRAFT_DEFAULT);

  const characterName    = useStore((s) => s.character.name);
  const credits          = useStore((s) => s.character.credits);
  const renown           = useStore((s) => s.character.renownLabel);
  const initializeOperatives = useStore((s) => s.initializeOperatives);
  const initCharacter    = useStore((s) => s.initCharacter);
  const initDevMode      = useStore((s) => s.initDevMode);

  const inInitFlow = characterName === null;

  useEffect(() => {
    initializeOperatives();
    initDevMode();
  }, []);

  const handleTabPress = useCallback((tabId) => {
    if (tabId === 'battle') {
      setBattleActive(true);
      return;
    }
    setActiveTab(tabId);
  }, []);

  const handleExitBattle = useCallback(() => {
    setBattleActive(false);
    setActiveTab('jobs');
  }, []);

  // Draft field setters passed to each init screen
  const setPath      = useCallback((v) => setInitDraft((d) => ({ ...d, path: v })), []);
  const setName      = useCallback((v) => setInitDraft((d) => ({ ...d, name: v })), []);

  // Called by FinalizeScreen with the fully assembled draft
  const handleInitComplete = useCallback((finalDraft) => {
    initCharacter(finalDraft);
    // character.name is now set → inInitFlow becomes false → game renders
    setActiveTab('neural');
  }, [initCharacter]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      </View>
    );
  }

  // ── Init flow (pre-game, no nav) ────────────────────────────────────────────
  if (inInitFlow) {
    return (
      <CRTBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {initStep === 1 && (
          <PathScreen
            draft={initDraft}
            onSetPath={setPath}
            onContinue={() => setInitStep(2)}
          />
        )}
        {initStep === 2 && (
          <IdentityScreen
            draft={initDraft}
            onSetName={setName}
            onBack={() => setInitStep(1)}
            onContinue={() => setInitStep(3)}
          />
        )}
        {initStep === 3 && (
          <FinalizeScreen
            draft={initDraft}
            onBack={() => setInitStep(2)}
            onComplete={handleInitComplete}
          />
        )}

        <NoiseTexture />
        <ScanlineOverlay />
      </CRTBackground>
    );
  }

  // ── Battle takeover ─────────────────────────────────────────────────────────
  if (battleActive) {
    return (
      <CRTBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <BattleScreen onExit={handleExitBattle} />
        <LevelUpBanner />
      </CRTBackground>
    );
  }

  // ── Main game ───────────────────────────────────────────────────────────────
  const subtitle = SCREEN_SUBTITLES[activeTab] || '';

  return (
    <CRTBackground>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.flex}>
        <ActiveScreen activeTab={activeTab} onNavigate={handleTabPress} />
      </View>

      <TopBanner
        subtitle={subtitle}
        telemetry={{ credits: fmtCredits(credits), renown }}
      />
      <LevelUpBanner />
      <ChoiceModal />
      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
      <NoiseTexture />
      <ScanlineOverlay />
      <DevPanel />
    </CRTBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.background },
});
