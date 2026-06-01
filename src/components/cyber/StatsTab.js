import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../../store/index';
import { CYBERWARE_ITEMS } from '../../data/cyberware';
import { calculateTeamLevel } from '../../data/leveling';
import { colors } from '../../theme/colors';

const BANNER_HEIGHT = 90;
const NAV_HEIGHT    = 72;
const STAT_KEYS     = ['chrome', 'edge', 'ghost', 'face', 'grit', 'wire'];
const STAT_BAR_MAX  = 80; // 4 members × 20 max per stat

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeAggregateStats(members) {
  const totals = { chrome: 0, edge: 0, ghost: 0, face: 0, grit: 0, wire: 0 };
  members.forEach((m) => {
    Object.entries(m.stats || {}).forEach(([stat, val]) => {
      if (Object.prototype.hasOwnProperty.call(totals, stat)) totals[stat] += val;
    });
    (m.equippedCyberware || []).forEach((cybId) => {
      const cyb = CYBERWARE_ITEMS.find((c) => c.id === cybId);
      if (cyb?.bonuses) {
        Object.entries(cyb.bonuses).forEach(([stat, val]) => {
          if (Object.prototype.hasOwnProperty.call(totals, stat)) totals[stat] += val;
        });
      }
    });
  });
  return totals;
}

function computeClassComposition(members) {
  const counts = {};
  members.forEach((m) => { counts[m.class] = (counts[m.class] || 0) + 1; });
  return counts;
}

function computeCyberwareBonus(member) {
  const totals = {};
  (member.equippedCyberware || []).forEach((cybId) => {
    const cyb = CYBERWARE_ITEMS.find((c) => c.id === cybId);
    if (cyb?.bonuses) {
      Object.entries(cyb.bonuses).forEach(([stat, val]) => {
        totals[stat] = (totals[stat] || 0) + val;
      });
    }
  });
  return totals;
}

function calculateMaxRAM(members) {
  const netrunners = members.filter(
    (m) => m.class?.toLowerCase() === 'netrunner' && (m.vitals?.current ?? 1) > 0,
  );
  if (netrunners.length === 0) return 0;
  const total = netrunners.reduce(
    (sum, nr) => sum + ((nr.stats?.wire || 0) + (nr.stats?.edge || 0)), 0,
  );
  return Math.min(18, Math.floor(total / 4));
}

function getHumanityStatus(ratio) {
  if (ratio >= 0.7) return { label: 'STABLE',   color: colors.primary };
  if (ratio >= 0.5) return { label: 'MODERATE', color: colors.secondary };
  if (ratio >= 0.3) return { label: 'LOW',       color: colors.error };
  return                   { label: 'CRITICAL',  color: colors.error };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatRow({ label, value, note }) {
  return (
    <View style={st.statRow}>
      <Text style={st.statRowLabel}>{label}:</Text>
      <Text style={st.statRowValue}>{value}</Text>
      {note ? <Text style={st.statRowNote}>({note})</Text> : null}
    </View>
  );
}

function StatBarRow({ stat, total, count }) {
  const fillPct = Math.min(100, (total / STAT_BAR_MAX) * 100);
  const avg     = count > 0 ? (total / count).toFixed(1) : '0.0';
  return (
    <View style={st.barRow}>
      <Text style={st.barLabel}>{stat.toUpperCase().padEnd(6)}</Text>
      <View style={st.barTrack}>
        <View style={[st.barFill, { width: `${fillPct}%` }]} />
      </View>
      <Text style={st.barTotal}>{String(total).padStart(2, ' ')}</Text>
      <Text style={st.barAvg}>avg {avg}</Text>
    </View>
  );
}

function OperativeBreakdownCard({ member }) {
  const bonus        = computeCyberwareBonus(member);
  const bonusEntries = Object.entries(bonus);
  const hRatio       = member.humanity.current / member.humanity.max;
  const hStatus      = getHumanityStatus(hRatio);

  const equippedNames = (member.equippedCyberware || [])
    .map((id) => {
      const cyb = CYBERWARE_ITEMS.find((c) => c.id === id);
      return cyb?.name ?? id;
    })
    .join(', ') || '[NONE]';

  const statLine = STAT_KEYS
    .map((k) => `${k.slice(0, 3).toUpperCase()} ${member.stats?.[k] ?? 0}`)
    .join('  ');

  return (
    <View style={st.opCard}>
      <View style={st.opHeader}>
        <Text style={st.opName}>[{member.name.toUpperCase()}]</Text>
        <Text style={st.opMeta}>{member.class.toUpperCase()} // LVL {member.level}</Text>
      </View>
      <Text style={st.opLine}>{statLine}</Text>
      <Text style={[st.opLine, { color: colors.secondary }]}>
        {'EQUIPPED:  '}{equippedNames}
      </Text>
      {bonusEntries.length > 0 && (
        <Text style={[st.opLine, { color: colors.primary }]}>
          {'CYBER:     '}
          {bonusEntries.map(([k, v]) => `+${v} ${k.toUpperCase()}`).join('  ')}
        </Text>
      )}
      <Text style={[st.opLine, { color: hStatus.color }]}>
        {'HUMANITY:  '}{member.humanity.current}/{member.humanity.max}{'  '}{hStatus.label}
      </Text>
    </View>
  );
}

// ── StatsTab ─────────────────────────────────────────────────────────────────

export default function StatsTab() {
  const members   = useStore((s) => s.crew.members);
  const teamLevel = calculateTeamLevel(members);

  const aggregateStats   = computeAggregateStats(members);
  const classComposition = computeClassComposition(members);
  const ramPool          = calculateMaxRAM(members);
  const count            = members.length;

  return (
    <ScrollView
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Team Diagnostic */}
      <View style={st.section}>
        <Text style={st.sectionLabel}>TEAM_DIAGNOSTIC // AGGREGATE</Text>
        <StatRow
          label="ACTIVE_ROSTER"
          value={`${String(count).padStart(2, '0')}/04`}
        />
        <StatRow label="TEAM_LEVEL" value={String(teamLevel).padStart(2, '0')} />
        {Object.keys(classComposition).length > 0 && (
          <View style={st.classBlock}>
            <Text style={st.classBlockLabel}>CLASS_COMPOSITION:</Text>
            {Object.entries(classComposition).map(([cls, n]) => (
              <Text key={cls} style={st.classLine}>
                {'  '}{cls.toUpperCase().padEnd(18)} × {n}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Combat Pools */}
      <View style={st.section}>
        <Text style={st.sectionLabel}>COMBAT_POOLS</Text>
        <StatRow
          label="RAM_POOL"
          value={`${ramPool} max`}
          note={ramPool > 0 ? 'netrunner stats' : 'no netrunners'}
        />
        <StatRow label="CYBER_POOL" value="10 max" note="baseline" />
      </View>

      {/* Aggregate Stat Bars */}
      <View style={st.section}>
        <Text style={st.sectionLabel}>AGGREGATE_STATS</Text>
        <View style={st.barsContainer}>
          {STAT_KEYS.map((stat) => (
            <StatBarRow
              key={stat}
              stat={stat}
              total={aggregateStats[stat] || 0}
              count={count}
            />
          ))}
        </View>
      </View>

      {/* Per-Operative Breakdown */}
      <View style={st.section}>
        <Text style={st.sectionLabel}>PER_OPERATIVE_BREAKDOWN</Text>
        {count === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyText}>[NO_CREW — RECRUIT_OPERATIVES_FIRST]</Text>
          </View>
        ) : (
          members.map((m) => <OperativeBreakdownCard key={m.id} member={m} />)
        )}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: {
    paddingTop: 12,
    paddingBottom: NAV_HEIGHT + 24,
    paddingHorizontal: 16,
    gap: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: `${colors.primary}88`,
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}22`,
    paddingBottom: 6,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  statRowLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    width: 120,
  },
  statRowValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
  },
  statRowNote: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  classBlock: {
    marginTop: 4,
    gap: 2,
  },
  classBlockLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  classLine: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
  barsContainer: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    width: 50,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}22`,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  barTotal: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primaryFixedDim,
    letterSpacing: 0.5,
    width: 24,
    textAlign: 'right',
  },
  barAvg: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.5,
    width: 52,
  },
  opCard: {
    borderWidth: 1,
    borderColor: `${colors.outline}33`,
    borderLeftWidth: 2,
    borderLeftColor: `${colors.primary}66`,
    backgroundColor: `${colors.primary}05`,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  opName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  opMeta: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  opLine: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
