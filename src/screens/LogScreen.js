import React, { useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store/index';
import LogEntry from '../components/LogEntry';
import AdvanceCycleFAB from '../components/AdvanceCycleFAB';
import { advanceTurn } from '../engine/turnPipeline';
import { colors } from '../theme/colors';
import { labelCaps, headlineMd } from '../theme/fonts';

const BANNER_HEIGHT = 90;
const EMPTY_SLOTS = ['SLOT_A', 'SLOT_B', 'SLOT_C', 'SLOT_D'];

function CrewSlot({ slotId }) {
  return (
    <View style={styles.crewSlot}>
      <View style={styles.crewAvatar}>
        <MaterialIcons name="person" size={16} color={`${colors.primary}40`} />
      </View>
      <View style={styles.crewInfo}>
        <Text style={styles.crewName}>EMPTY_SLOT</Text>
        <View style={styles.barRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.barHp, { width: '0%' }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.barMp, { width: '0%' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ListHeader({ entries }) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <View style={styles.listHeader}>
      {/* Crew block */}
      <View style={styles.crewBlock}>
        <View style={styles.crewGrid}>
          {EMPTY_SLOTS.map((id) => (
            <CrewSlot key={id} slotId={id} />
          ))}
        </View>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <MaterialIcons name="payments" size={14} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.primary }]}>CR: 1,000</Text>
        </View>
        <View style={styles.statusItem}>
          <MaterialIcons name="grade" size={14} color={colors.secondary} />
          <Text style={[styles.statusText, { color: colors.secondary }]}>REP: GHOST</Text>
        </View>
      </View>

      {/* NEURAL_ARCHIVE header */}
      <View style={styles.archiveHeader}>
        <View style={styles.archiveTitleRow}>
          <MaterialIcons name="terminal" size={20} color={colors.primary} />
          <Text style={styles.archiveTitle}>NEURAL_ARCHIVE</Text>
        </View>
        <Text style={styles.archiveTimestamp}>
          D_001 // {timeStr}
        </Text>
      </View>

      {entries.length === 0 && (
        <View style={styles.emptyLog}>
          <Text style={styles.emptyText}>{'> AWAITING_PROTOCOL_INPUT...'}</Text>
          <Text style={[styles.emptyText, { marginTop: 4, color: colors.outline }]}>
            TAP ADVANCE_CYCLE TO BEGIN
          </Text>
        </View>
      )}
    </View>
  );
}

export default function LogScreen() {
  const entries = useStore((s) => s.log.entries);
  const flatListRef = useRef(null);

  const handleAdvance = () => {
    advanceTurn();
    // Auto-scroll to bottom after state update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        ref={flatListRef}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LogEntry entry={item} index={index} />
        )}
        ListHeaderComponent={<ListHeader entries={entries} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (entries.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />
      <AdvanceCycleFAB onPress={handleAdvance} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: BANNER_HEIGHT,
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  listHeader: {
    marginTop: 8,
    marginBottom: 16,
  },

  // Crew block
  crewBlock: {
    backgroundColor: 'rgba(28,27,29,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,243,255,0.2)',
    marginBottom: 12,
  },
  crewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  crewSlot: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,243,255,0.1)',
  },
  crewAvatar: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,243,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,243,255,0.05)',
    flexShrink: 0,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: `${colors.primary}66`,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  barRow: {
    marginBottom: 2,
  },
  barBg: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  barHp: {
    backgroundColor: colors.tertiaryFixedDim,
  },
  barMp: {
    backgroundColor: colors.primary,
  },

  // Status bar
  statusBar: {
    backgroundColor: 'rgba(28,27,29,0.8)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${colors.secondaryContainer}4D`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Archive header
  archiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}4D`,
    paddingBottom: 8,
    marginBottom: 16,
  },
  archiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  archiveTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    // Neon text glow approximation via shadow
    textShadowColor: 'rgba(0,243,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  archiveTimestamp: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Empty log state
  emptyLog: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 12,
    color: `${colors.primary}66`,
    letterSpacing: 0.8,
  },
});
