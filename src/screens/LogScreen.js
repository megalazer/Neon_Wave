import React, { useRef, useEffect } from 'react';
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

const BANNER_HEIGHT = 90;

function CrewSlot({ member }) {
  const hpPct = member ? `${Math.round((member.vitals.current / member.vitals.max) * 100)}%` : '0%';
  const mpPct = member ? `${Math.round((member.neural.current / member.neural.max) * 100)}%` : '0%';
  const humPct = member ? `${Math.round((member.humanity.current / member.humanity.max) * 100)}%` : '0%';
  const avatarColor = member ? (member.classColor || colors.primary) : `${colors.primary}40`;

  return (
    <View style={styles.crewSlot}>
      <View style={[styles.crewAvatar, member && styles.crewAvatarFilled]}>
        <MaterialIcons name="person" size={16} color={avatarColor} />
      </View>
      <View style={styles.crewInfo}>
        <Text style={[styles.crewName, member && styles.crewNameFilled]}>
          {member ? member.name.toUpperCase() : 'EMPTY_SLOT'}
        </Text>
        <View style={styles.barRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.barHp, { width: hpPct }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.barMp, { width: mpPct }]} />
          </View>
        </View>
        <View style={styles.barRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, styles.barHum, { width: humPct }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Rendered as a plain View above the FlatList — always visible, never scrolls away
function LogHeaderSection({ entriesEmpty }) {
  const members = useStore((s) => s.crew.members);
  const credits = useStore((s) => s.character.credits);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const displaySlots = [members[0] || null, members[1] || null, members[2] || null, members[3] || null];

  return (
    <View style={styles.headerSection}>
      {/* Crew block */}
      <View style={styles.crewBlock}>
        <View style={styles.crewGrid}>
          {displaySlots.map((member, i) => (
            <CrewSlot key={i} member={member} />
          ))}
        </View>
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <MaterialIcons name="payments" size={14} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.primary }]}>CR: {credits.toLocaleString()}</Text>
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
        <Text style={styles.archiveTimestamp}>D_001 // {timeStr}</Text>
      </View>

      {entriesEmpty && (
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
  const listRef = useRef(null);
  const entries = useStore((s) => s.log.entries);
  const entryCount = entries.length;

  useEffect(() => {
    if (listRef.current && entryCount > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [entryCount]);

  return (
    <View style={styles.screen}>
      <LogHeaderSection entriesEmpty={entryCount === 0} />

      <FlatList
        ref={listRef}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LogEntry entry={item} index={index} />
        )}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <AdvanceCycleFAB onPress={advanceTurn} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Static header above the inverted FlatList
  headerSection: {
    paddingTop: BANNER_HEIGHT,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Crew block
  crewBlock: {
    backgroundColor: 'rgba(28,27,29,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,243,255,0.2)',
    marginBottom: 12,
    marginTop: 8,
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
  crewAvatarFilled: {
    borderColor: 'rgba(0,243,255,0.8)',
    backgroundColor: 'rgba(0,243,255,0.1)',
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
  crewNameFilled: {
    color: colors.primary,
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
  barHum: {
    backgroundColor: colors.secondaryContainer,
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

  // Inverted FlatList content
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,    // visual top — gap between header and newest entry
    paddingTop: 160,     // visual bottom — clearance above BottomNav + FAB
  },
});
