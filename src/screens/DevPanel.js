import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { useStore } from '../store/index';
import { COINS } from '../data/coins';
import { devAdvanceTurns } from '../engine/turnPipeline';
import { XP_THRESHOLDS, MAX_LEVEL, getLevelProgress } from '../data/leveling';
import { ALL_EVENTS } from '../data/events/index';
import { ALL_CONTRACTS as CONTRACTS } from '../data/contracts/index';
import { rollQuality, getSpawnWeights } from '../data/recruitQuality';

const ERR = colors.error;

const FACTIONS = [
  { id: 'helix',     label: 'HELIX_CORP' },
  { id: 'onyx',      label: 'ONYX_SYNDICATE' },
  { id: 'novalith',  label: 'NOVALITH' },
  { id: 'sable',     label: 'SABLE' },
  { id: 'undercity', label: 'UNDERCITY' },
];

// ── Section wrapper ──────────────────────────────────────────────────────────
function DevSection({ title, children }) {
  return (
    <View style={sec.box}>
      <Text style={sec.title}>{title}</Text>
      {children}
    </View>
  );
}

// ── Small action button ──────────────────────────────────────────────────────
function DevBtn({ label, onPress, danger, dim }) {
  return (
    <TouchableOpacity
      style={[btn.base, danger && btn.danger, dim && btn.dim]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[btn.label, danger && btn.dangerLabel, dim && btn.dimLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Row: label + input + button ──────────────────────────────────────────────
function InputRow({ label, placeholder, value, onChangeText, onSubmit, submitLabel = '[SET]' }) {
  return (
    <View style={row.wrap}>
      <Text style={row.label}>{label}</Text>
      <View style={row.right}>
        <TextInput
          style={row.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={`${ERR}44`}
          keyboardType="numeric"
          selectionColor={ERR}
        />
        <DevBtn label={submitLabel} onPress={onSubmit} />
      </View>
    </View>
  );
}

// ── Credits section ──────────────────────────────────────────────────────────
function CreditsSection() {
  const credits     = useStore((s) => s.character.credits);
  const devSetCredits = useStore((s) => s.devSetCredits);
  const [val, setVal] = useState('');

  return (
    <DevSection title="CREDITS_OVERRIDE">
      <Text style={sec.current}>CURRENT: {credits.toLocaleString()} CR</Text>
      <InputRow
        label="SET_CREDITS"
        placeholder="100000"
        value={val}
        onChangeText={setVal}
        onSubmit={() => { devSetCredits(val); setVal(''); }}
      />
      <View style={sec.row}>
        <DevBtn label="+10K"  onPress={() => devSetCredits(credits + 10000)} />
        <DevBtn label="+100K" onPress={() => devSetCredits(credits + 100000)} />
        <DevBtn label="+1M"   onPress={() => devSetCredits(credits + 1000000)} />
      </View>
    </DevSection>
  );
}

// ── Turn section ─────────────────────────────────────────────────────────────
function TurnSection() {
  const turn    = useStore((s) => s.character.turnNumber);
  const devSetTurn = useStore((s) => s.devSetTurn);
  const [val, setVal] = useState('');

  return (
    <DevSection title="TURN_MANIPULATION">
      <Text style={sec.current}>CURRENT_TURN: {turn}</Text>
      <View style={sec.row}>
        <DevBtn label="+1"  onPress={() => devAdvanceTurns(1)} />
        <DevBtn label="+5"  onPress={() => devAdvanceTurns(5)} />
        <DevBtn label="+10" onPress={() => devAdvanceTurns(10)} />
        <DevBtn label="+50" onPress={() => devAdvanceTurns(50)} />
      </View>
      <InputRow
        label="SET_TURN"
        placeholder="100"
        value={val}
        onChangeText={setVal}
        onSubmit={() => { devSetTurn(val); setVal(''); }}
      />
    </DevSection>
  );
}

// ── Character section ────────────────────────────────────────────────────────
function CharacterSection() {
  const character    = useStore((s) => s.character);
  const devSetName   = useStore((s) => s.devSetName);
  const devInjectLog = useStore((s) => s.devInjectLog);
  const [nameVal, setNameVal] = useState('');

  const setName = () => {
    if (!nameVal.trim()) return;
    devSetName(nameVal.trim());
    devInjectLog(`[DEV] Character name set to "${nameVal.trim()}".`);
    setNameVal('');
  };

  return (
    <DevSection title="CHARACTER_OVERRIDE">
      <Text style={sec.current}>
        NAME: {character.name || 'NULL'} // PATH: {character.path || 'NULL'}
      </Text>
      <Text style={sec.current}>
        CHROME:{character.stats.chrome} EDGE:{character.stats.edge} GHOST:{character.stats.ghost}
      </Text>
      <InputRow
        label="SET_NAME"
        placeholder="V"
        value={nameVal}
        onChangeText={setNameVal}
        onSubmit={setName}
      />
    </DevSection>
  );
}

// ── Crew section ─────────────────────────────────────────────────────────────
function CrewSection() {
  const members       = useStore((s) => s.crew.members);
  const devFillCrewVitals = useStore((s) => s.devFillCrewVitals);

  return (
    <DevSection title="CREW_OVERRIDE">
      <Text style={sec.current}>MEMBERS: {members.length}</Text>
      <DevBtn label="[FILL_ALL_VITALS]" onPress={devFillCrewVitals} />
    </DevSection>
  );
}

// ── Faction section ──────────────────────────────────────────────────────────
function FactionSection() {
  const factionPower     = useStore((s) => s.world.factionPower);
  const devSetFactionPower = useStore((s) => s.devSetFactionPower);

  return (
    <DevSection title="FACTION_OVERRIDE">
      {FACTIONS.map((f) => {
        const power = factionPower[f.id] ?? 0;
        return (
          <View key={f.id} style={fac.row}>
            <Text style={fac.label}>{f.label}</Text>
            <Text style={fac.val}>{power}</Text>
            <DevBtn label="-10" onPress={() => devSetFactionPower(f.id, power - 10)} dim />
            <DevBtn label="+10" onPress={() => devSetFactionPower(f.id, power + 10)} />
          </View>
        );
      })}
    </DevSection>
  );
}

// ── Exchange section ─────────────────────────────────────────────────────────
function ExchangeSection() {
  const coins          = useStore((s) => s.exchange.coins);
  const holdings       = useStore((s) => s.exchange.holdings);
  const devSetCoinPrice = useStore((s) => s.devSetCoinPrice);
  const devSpikeCoin   = useStore((s) => s.devSpikeCoin);
  const devCrashCoin   = useStore((s) => s.devCrashCoin);
  const [prices, setPrices] = useState({});

  return (
    <DevSection title="EXCHANGE_OVERRIDE">
      {COINS.map((c) => {
        const coin = coins[c.id];
        return (
          <View key={c.id} style={exch.block}>
            <View style={exch.header}>
              <Text style={exch.symbol}>{c.symbol}</Text>
              <Text style={exch.price}>{coin?.currentPrice.toLocaleString()} CR</Text>
              <Text style={exch.held}>HOL:{holdings[c.id]?.toFixed(2)}</Text>
            </View>
            <View style={sec.row}>
              <TextInput
                style={exch.input}
                value={prices[c.id] || ''}
                onChangeText={(v) => setPrices((p) => ({ ...p, [c.id]: v }))}
                placeholder="price"
                placeholderTextColor={`${ERR}44`}
                keyboardType="numeric"
                selectionColor={ERR}
              />
              <DevBtn label="[SET]"  onPress={() => { devSetCoinPrice(c.id, prices[c.id]); setPrices((p) => ({ ...p, [c.id]: '' })); }} />
              <DevBtn label="[×2]"   onPress={() => devSpikeCoin(c.id)} />
              <DevBtn label="[÷2]"   onPress={() => devCrashCoin(c.id)} dim />
            </View>
          </View>
        );
      })}
    </DevSection>
  );
}

// ── Leveling section ─────────────────────────────────────────────────────────
const SET_LEVELS = [1, 3, 5, 8, 10];

function LevelingSection() {
  const character        = useStore((s) => s.character);
  const members          = useStore((s) => s.crew.members);
  const devAddCharacterXP      = useStore((s) => s.devAddCharacterXP);
  const devSetCharacterLevel   = useStore((s) => s.devSetCharacterLevel);
  const devAddCrewXP           = useStore((s) => s.devAddCrewXP);
  const devSetCrewMemberLevel  = useStore((s) => s.devSetCrewMemberLevel);
  const devLevelAllCrew        = useStore((s) => s.devLevelAllCrew);
  const devSetTeamLevel        = useStore((s) => s.devSetTeamLevel);
  const devResetLeveling       = useStore((s) => s.devResetLeveling);
  const devTriggerLevelUpBanner = useStore((s) => s.devTriggerLevelUpBanner);
  const devForceCombatXP       = useStore((s) => s.devForceCombatXP);

  const progress = getLevelProgress(character.exp);
  const progressStr = progress.maxed
    ? 'MAXED'
    : `${progress.current}/${progress.needed} XP (${Math.round(progress.percent)}%)`;

  return (
    <DevSection title="LEVELING_OVERRIDE">
      {/* Player */}
      <Text style={sec.current}>
        {`PLAYER: LVL_${character.level} // ${character.exp} XP TOTAL`}
      </Text>
      <Text style={sec.current}>{`PROGRESS: ${progressStr}`}</Text>

      <View style={sec.row}>
        <DevBtn label="+50 XP"   onPress={() => devAddCharacterXP(50)} />
        <DevBtn label="+200 XP"  onPress={() => devAddCharacterXP(200)} />
        <DevBtn label="+1000 XP" onPress={() => devAddCharacterXP(1000)} />
      </View>

      <Text style={[sec.current, { marginTop: 4 }]}>SET_LVL:</Text>
      <View style={sec.row}>
        {SET_LEVELS.map((lvl) => (
          <DevBtn
            key={lvl}
            label={lvl === MAX_LEVEL ? `${lvl} MAX` : String(lvl)}
            onPress={() => devSetCharacterLevel(lvl)}
          />
        ))}
      </View>

      {/* Crew */}
      {members.length > 0 && (
        <>
          <Text style={[sec.current, { marginTop: 6 }]}>CREW XP:</Text>
          {members.map((m) => (
            <View key={m.id} style={lev.memberRow}>
              <Text style={lev.memberName} numberOfLines={1}>
                {`${m.name} LVL_${m.level || 1}`}
              </Text>
              <View style={lev.memberBtns}>
                <DevBtn label="+50"  onPress={() => devAddCrewXP(m.id, 50)} />
                <DevBtn label="+200" onPress={() => devAddCrewXP(m.id, 200)} />
                <DevBtn label="LVL10" onPress={() => devSetCrewMemberLevel(m.id, MAX_LEVEL)} />
              </View>
            </View>
          ))}

          <View style={[sec.row, { marginTop: 4 }]}>
            <DevBtn label="[ALL_LVL_5]"  onPress={() => devLevelAllCrew(5)} />
            <DevBtn label="[ALL_LVL_10]" onPress={() => devLevelAllCrew(MAX_LEVEL)} />
          </View>
        </>
      )}

      {/* Team Level */}
      <Text style={[sec.current, { marginTop: 6 }]}>SET_TEAM_LVL:</Text>
      <View style={sec.row}>
        {SET_LEVELS.map((lvl) => (
          <DevBtn
            key={`team_${lvl}`}
            label={String(lvl)}
            onPress={() => devSetTeamLevel(lvl)}
          />
        ))}
      </View>

      {/* Test triggers */}
      <View style={[sec.row, { marginTop: 6 }]}>
        <DevBtn label="[TRIGGER_BANNER]"  onPress={devTriggerLevelUpBanner} />
        <DevBtn label="[FORCE_200_XP]"    onPress={devForceCombatXP} />
      </View>
      <DevBtn label="[RESET_LEVELING]" onPress={devResetLeveling} danger />
    </DevSection>
  );
}

// ── Random events section ────────────────────────────────────────────────────
function RandomEventsSection() {
  const morale             = useStore((s) => s.character.morale);
  const firedCount         = useStore((s) => s.event.firedEventIds.size);
  const tsSinceChoice      = useStore((s) => s.event.turnsSinceLastChoice);
  const tsSinceFlavor      = useStore((s) => s.event.turnsSinceLastFlavor);
  const devForceFlavorEvent  = useStore((s) => s.devForceFlavorEvent);
  const devForceChoiceEvent  = useStore((s) => s.devForceChoiceEvent);
  const devForceEventById    = useStore((s) => s.devForceEventById);
  const devResetEventHistory = useStore((s) => s.devResetEventHistory);
  const devSetMorale         = useStore((s) => s.devSetMorale);
  const devAddMorale         = useStore((s) => s.devAddMorale);

  const [eventIdVal, setEventIdVal] = useState('');

  return (
    <DevSection title="RANDOM_EVENTS_OVERRIDE">
      <Text style={sec.current}>
        {`MORALE: ${morale ?? 50} // FIRED: ${firedCount}/${ALL_EVENTS.length}`}
      </Text>
      <Text style={sec.current}>
        {`TURNS_SINCE_CHOICE: ${tsSinceChoice} // TURNS_SINCE_FLAVOR: ${tsSinceFlavor}`}
      </Text>

      <View style={sec.row}>
        <DevBtn label="[FORCE_FLAVOR]"  onPress={devForceFlavorEvent} />
        <DevBtn label="[FORCE_CHOICE]"  onPress={devForceChoiceEvent} />
      </View>

      <View style={row.wrap}>
        <Text style={row.label}>FIRE_BY_ID</Text>
        <View style={row.right}>
          <TextInput
            style={[row.input, { flex: 1 }]}
            value={eventIdVal}
            onChangeText={setEventIdVal}
            placeholder="flv_rain_neon"
            placeholderTextColor={`${ERR}44`}
            selectionColor={ERR}
            autoCapitalize="none"
          />
          <DevBtn
            label="[FIRE]"
            onPress={() => { devForceEventById(eventIdVal.trim()); setEventIdVal(''); }}
          />
        </View>
      </View>

      <DevBtn label="[RESET_EVENT_HISTORY]" onPress={devResetEventHistory} danger />

      <Text style={[sec.current, { marginTop: 4 }]}>MORALE: {morale ?? 50}</Text>
      <View style={sec.row}>
        <DevBtn label="-10" onPress={() => devAddMorale(-10)} dim />
        <DevBtn label="+10" onPress={() => devAddMorale(10)} />
        <DevBtn label="SET_0"   onPress={() => devSetMorale(0)} danger />
        <DevBtn label="SET_100" onPress={() => devSetMorale(100)} />
      </View>
    </DevSection>
  );
}

// ── Contract override section ────────────────────────────────────────────────
function ContractOverrideSection() {
  const phase             = useStore((s) => s.contract.phase);
  const activeContractId  = useStore((s) => s.contract.activeContractId);
  const activeStageIndex  = useStore((s) => s.contract.activeStageIndex);
  const feedItems         = useStore((s) => s.contract.feedItems);
  const fixerRep          = useStore((s) => s.contract.fixerRep);
  const devForceStart     = useStore((s) => s.devForceStartContract);
  const devForceRes       = useStore((s) => s.devForceContractResolution);
  const devClear          = useStore((s) => s.devClearActiveContract);
  const devRefreshFeed    = useStore((s) => s.devForceRefreshFeed);

  const allContracts = CONTRACTS;

  return (
    <DevSection title="CONTRACT_OVERRIDE">
      <Text style={sec.current}>
        {`PHASE: ${phase.toUpperCase()}`}
      </Text>
      <Text style={sec.current}>
        {`ACTIVE: ${activeContractId ?? 'NULL'} // STAGE: ${activeStageIndex}`}
      </Text>
      <Text style={sec.current}>
        {`FEED: ${feedItems.length} item(s)`}
      </Text>

      <View style={[sec.row, { marginTop: 6 }]}>
        <DevBtn label="[REFRESH_FEED]" onPress={devRefreshFeed} />
        <DevBtn label="[CLEAR_ACTIVE]" onPress={devClear} danger dim={phase === 'feed'} />
      </View>

      <Text style={[sec.current, { marginTop: 6 }]}>FORCE_START (by tier):</Text>
      <View style={sec.row}>
        {['LOW', 'MID', 'HIGH'].map((tier) => {
          const c = allContracts.find((x) => x.tier === tier);
          if (!c) return null;
          return (
            <DevBtn
              key={tier}
              label={`[${tier}]`}
              onPress={() => devForceStart(c.id)}
              dim={phase !== 'feed'}
            />
          );
        })}
      </View>

      <Text style={[sec.current, { marginTop: 6 }]}>FORCE_RESOLUTION:</Text>
      <View style={sec.row}>
        <DevBtn label="[SUCCESS]"  onPress={() => devForceRes('success')}  dim={phase !== 'active'} />
        <DevBtn label="[FAILURE]"  onPress={() => devForceRes('failure')}  dim={phase !== 'active'} danger />
        <DevBtn label="[ABORTED]"  onPress={() => devForceRes('aborted')}  dim={phase !== 'active'} />
      </View>

      <Text style={[sec.current, { marginTop: 6 }]}>
        {`FIXER_REP: remi=${fixerRep.remi ?? 0} pyre=${fixerRep.pyre ?? 0} nyx=${fixerRep.nyx ?? 0}`}
      </Text>
    </DevSection>
  );
}

// ── Recruit override section ─────────────────────────────────────────────────
function runSpawnTest(contractsCompleted, n) {
  const results = { common: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < n; i++) results[rollQuality(contractsCompleted)]++;
  return results;
}

function RecruitOverrideSection() {
  const spawnEnabled        = useStore((s) => s.crew.spawnEnabled);
  const turnsSinceLastSpawn = useStore((s) => s.crew.turnsSinceLastSpawn);
  const availableOperatives = useStore((s) => s.crew.availableOperatives);
  const completedContracts  = useStore((s) => s.contract.completedContracts);
  const forceSpawnRecruit   = useStore((s) => s.forceSpawnRecruit);
  const devToggleSpawn      = useStore((s) => s.devToggleSpawn);
  const devClearPool        = useStore((s) => s.devClearGeneratedPool);
  const devSetContracts     = useStore((s) => s.devSetContractsCompleted);

  const [testResults, setTestResults] = useState(null);
  const contractCount = completedContracts.length;
  const generatedCount = availableOperatives.filter((r) => r.quality !== undefined).length;
  const weights = getSpawnWeights(contractCount);

  return (
    <DevSection title="RECRUIT_OVERRIDE">
      <Text style={sec.current}>
        {`SPAWN: ${spawnEnabled ? 'ON' : 'OFF'} // TSS: ${turnsSinceLastSpawn} // POOL: ${generatedCount}`}
      </Text>
      <Text style={sec.current}>
        {`CONTRACTS: ${contractCount} // WEIGHTS: C${weights.common}% R${weights.rare}% L${weights.legendary}%`}
      </Text>

      <Text style={[sec.current, { marginTop: 4 }]}>FORCE_SPAWN:</Text>
      <View style={sec.row}>
        <DevBtn label="[COMMON]"    onPress={() => forceSpawnRecruit('common')} />
        <DevBtn label="[RARE]"      onPress={() => forceSpawnRecruit('rare')} />
        <DevBtn label="[LEGENDARY]" onPress={() => forceSpawnRecruit('legendary')} />
      </View>

      <Text style={[sec.current, { marginTop: 4 }]}>SET_CONTRACTS_DONE:</Text>
      <View style={sec.row}>
        {[0, 5, 10, 20].map((n) => (
          <DevBtn key={n} label={String(n)} onPress={() => devSetContracts(n)} />
        ))}
      </View>

      <View style={[sec.row, { marginTop: 4 }]}>
        <DevBtn
          label={spawnEnabled ? '[DISABLE_SPAWN]' : '[ENABLE_SPAWN]'}
          onPress={devToggleSpawn}
        />
        <DevBtn label="[CLEAR_POOL]" onPress={devClearPool} danger />
      </View>

      <DevBtn
        label="[RUN_SPAWN_TEST_100]"
        onPress={() => setTestResults(runSpawnTest(contractCount, 100))}
      />
      {testResults && (
        <Text style={sec.current}>
          {`RESULT // C:${testResults.common} R:${testResults.rare} L:${testResults.legendary}`}
        </Text>
      )}
    </DevSection>
  );
}

// ── Inventory section (stub) ─────────────────────────────────────────────────
function InventorySection() {
  return (
    <DevSection title="INVENTORY_OVERRIDE">
      <Text style={sec.stub}>[PROTOCOL_NOT_IMPLEMENTED]</Text>
    </DevSection>
  );
}

// ── Log section ──────────────────────────────────────────────────────────────
function LogSection() {
  const entries     = useStore((s) => s.log.entries);
  const devClearLog = useStore((s) => s.devClearLog);
  const devInjectLog = useStore((s) => s.devInjectLog);
  const [text, setText] = useState('');

  const handleClear = () =>
    Alert.alert('CLEAR_LOG', 'Delete all log entries?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'CONFIRM', style: 'destructive', onPress: devClearLog },
    ]);

  return (
    <DevSection title="LOG_OVERRIDE">
      <Text style={sec.current}>ENTRIES: {entries.length}</Text>
      <DevBtn label="[CLEAR_LOG]" onPress={handleClear} danger />
      <View style={sec.row}>
        <TextInput
          style={[row.input, { flex: 1 }]}
          value={text}
          onChangeText={setText}
          placeholder="inject text..."
          placeholderTextColor={`${ERR}44`}
          selectionColor={ERR}
        />
        <DevBtn label="[INJECT]" onPress={() => { devInjectLog(text); setText(''); }} />
      </View>
    </DevSection>
  );
}

// ── Reset section ────────────────────────────────────────────────────────────
function ResetSection() {
  const devSoftReset = useStore((s) => s.devSoftReset);
  const devHardReset = useStore((s) => s.devHardReset);

  const soft = () =>
    Alert.alert('SOFT_RESET', 'Reset character and return to init flow?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'CONFIRM', style: 'destructive', onPress: devSoftReset },
    ]);

  const hard = () =>
    Alert.alert('HARD_RESET', 'Wipe ALL game state including crew, factions, exchange?', [
      { text: 'CANCEL', style: 'cancel' },
      { text: 'CONFIRM', style: 'destructive', onPress: devHardReset },
    ]);

  return (
    <DevSection title="RESET_PROTOCOLS">
      <View style={sec.row}>
        <DevBtn label="[SOFT_RESET]" onPress={soft} danger />
        <DevBtn label="[HARD_RESET]" onPress={hard} danger />
      </View>
    </DevSection>
  );
}

// ── Main DevPanel modal ──────────────────────────────────────────────────────
export default function DevPanel() {
  const panelOpen    = useStore((s) => s.dev.panelOpen);
  const closeDevPanel = useStore((s) => s.closeDevPanel);

  const glitchX = useSharedValue(0);
  useEffect(() => {
    glitchX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200 }),
        withTiming(3, { duration: 40 }),
        withTiming(-3, { duration: 40 }),
        withTiming(1, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      ),
      -1,
    );
  }, []);
  const glitchStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: glitchX.value }],
  }));

  return (
    <Modal
      visible={panelOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeDevPanel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.Text style={[styles.headerTitle, glitchStyle]}>
              {'>>> DEV_PROTOCOL'}
            </Animated.Text>
            <TouchableOpacity onPress={closeDevPanel} activeOpacity={0.8}>
              <Text style={styles.closeBtn}>[CLOSE]</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>RESTRICTED ACCESS // INTERNAL USE ONLY</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <CreditsSection />
            <TurnSection />
            <CharacterSection />
            <LevelingSection />
            <CrewSection />
            <FactionSection />
            <ExchangeSection />
            <RandomEventsSection />
            <ContractOverrideSection />
            <RecruitOverrideSection />
            <InventorySection />
            <LogSection />
            <ResetSection />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  panel: {
    flex: 1,
    marginTop: 44,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 2,
    borderColor: ERR,
    shadowColor: ERR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: `${ERR}44`,
  },
  headerTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    color: ERR,
    letterSpacing: 2,
  },
  closeBtn: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: `${ERR}88`,
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 40 },
});

const sec = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: `${ERR}55`,
    padding: 12,
    gap: 8,
    backgroundColor: `${ERR}04`,
  },
  title: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: ERR,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  current: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  stub: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: `${ERR}66`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
});

const btn = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: `${ERR}88`,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  danger: {
    borderColor: ERR,
    backgroundColor: `${ERR}14`,
  },
  dim: {
    borderColor: `${ERR}44`,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: ERR,
    letterSpacing: 1,
  },
  dangerLabel: { color: ERR },
  dimLabel: { color: `${ERR}88` },
});

const row = StyleSheet.create({
  wrap: { gap: 4 },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${ERR}99`,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  right: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: `${ERR}55`,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontFamily: 'KodeMono_400Regular',
    fontSize: 12,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
});

const fac = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${ERR}99`,
    letterSpacing: 0.8,
    flex: 1,
  },
  val: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: ERR,
    width: 28,
    textAlign: 'right',
  },
});

const lev = StyleSheet.create({
  memberRow: {
    gap: 3,
  },
  memberName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${ERR}99`,
    letterSpacing: 0.8,
  },
  memberBtns: {
    flexDirection: 'row',
    gap: 6,
  },
});

const exch = StyleSheet.create({
  block: { gap: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: ERR,
    letterSpacing: 1,
    width: 40,
  },
  price: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.onSurface,
    flex: 1,
  },
  held: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: `${ERR}55`,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.onSurface,
    minWidth: 60,
  },
});
