import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store/index';
import { REAL_ESTATE, VEHICLES, MAX_REAL_ESTATE, MAX_VEHICLES } from '../data/lifestyle';
import { COINS } from '../data/coins';
import {
  ACCOUNT_ACHIEVEMENTS, RUN_ACHIEVEMENTS,
  getUnlockedTitles, getUnlockedThemes, DEFAULT_TITLE, DEFAULT_THEME,
} from '../data/achievements';
import { FACTION_LIST, FACTIONS, repTierFromValue, REP_MIN, REP_MAX } from '../data/factions';
import { Dimensions } from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import MinigameStub from '../components/MinigameStub';
import TradeModal from '../components/TradeModal';
import Sparkline from '../components/Sparkline';
import { INTERACTIONS, bondTierFromValue, BOND_MIN, BOND_MAX, getBondPerks, BOND_TIER_RANK, fixerTierFromRep } from '../data/relationships';
import { FRIENDS } from '../data/friends';
import { FIXERS } from '../data/fixers';
import { colors } from '../theme/colors';

const SCREEN_W = Dimensions.get('window').width;

const BANNER_H = 90;
const NAV_H = 72;

function fmtCR(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

// ─── SegmentedTabs ────────────────────────────────────────────────────────────
function SegmentedTabs({ active, onSelect, achievementsUnread }) {
  const TABS = [
    { id: 'assets', label: 'ASSETS', icon: 'account-balance-wallet' },
    { id: 'exchange', label: 'EXCHANGE', icon: 'show-chart' },
    { id: 'factions', label: 'FACTIONS', icon: 'groups' },
    { id: 'relations', label: 'BONDS', icon: 'favorite' },
    { id: 'achievements', label: 'TROPHIES', icon: 'emoji-events', dot: achievementsUnread },
  ];
  return (
    <View style={styles.segmented}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.segTab, isActive && styles.segTabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(tab.id);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name={tab.icon} size={20} color={isActive ? colors.primary : colors.outline} />
            <Text style={[styles.segTabText, isActive && styles.segTabTextActive]}>
              {tab.label}
            </Text>
            {tab.dot && <View style={styles.segTabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── AssetsSummaryStrip ───────────────────────────────────────────────────────
function AssetsSummaryStrip({ reCount, vehCount, lxCount }) {
  return (
    <View style={styles.summaryStrip}>
      <View style={styles.summaryLeft}>
        {[
          { label: 'Owned Real Estate', count: reCount, max: String(MAX_REAL_ESTATE) },
          { label: 'Vehicle Fleet',     count: vehCount, max: String(MAX_VEHICLES) },
          { label: 'Luxury Items',      count: lxCount,  max: '∞' },
        ].map((item) => (
          <View key={item.label} style={styles.summaryBlock}>
            <Text style={styles.summaryBlockLabel}>{item.label}</Text>
            <Text style={styles.summaryBlockValue}>
              {String(item.count).padStart(2, '0')}{' '}
              <Text style={styles.summaryBlockMax}>/ {item.max}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ index, label, accent }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionHeaderText, { color: accent }]}>
        {`0${index} // ${label}`}
      </Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

// ─── AssetCard ────────────────────────────────────────────────────────────────
function AssetCard({ asset, type, accent, accentOn, isOwned, credits, onPurchase, onLaunchMinigame }) {
  const canAfford = credits >= asset.cost;

  const btnLabel = isOwned
    ? 'OWNED // LAUNCH_MINIGAME'
    : canAfford
    ? (type === 're' ? 'INITIATE_PURCHASE_PROTOCOL' : 'DEPLOY_FUNDS_TRANSFER')
    : '[NO_FUNDS]';

  const btnIcon = isOwned ? 'play-arrow' : type === 're' ? 'lock-open' : asset.icon;
  const btnAccent = isOwned || canAfford ? accent : colors.error;

  return (
    <View style={[styles.assetCard, isOwned && { borderColor: accent, backgroundColor: `${accent}08` }]}>
      {/* Listing badge (real estate, top-left) */}
      {type === 're' && (
        <View style={[styles.listingBadge, { backgroundColor: accent }]}>
          <Text style={[styles.badgeText, { color: accentOn }]}>
            LISTING_ID: {asset.listingId}
          </Text>
        </View>
      )}

      {/* Serial badge (vehicles, top-right, hidden when owned) */}
      {type === 'veh' && !isOwned && (
        <View style={[styles.serialBadge, { backgroundColor: colors.secondaryContainer }]}>
          <Text style={[styles.badgeText, { color: colors.onSecondaryFixed }]}>
            SERIAL: {asset.serial}
          </Text>
        </View>
      )}

      {/* Owned chip (top-right) */}
      {isOwned && (
        <View style={[styles.ownedChip, { backgroundColor: accent }]}>
          <Text style={[styles.badgeText, { color: accentOn }]}>OWNED</Text>
        </View>
      )}

      {/* 16:9 image placeholder */}
      <View style={[styles.imgPlaceholder, { backgroundColor: `${accent}0D` }]}>
        <MaterialIcons name={asset.icon} size={52} color={`${accent}40`} />
      </View>

      {/* Card body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardName, { color: accent }]} numberOfLines={1}>
              {asset.name.toUpperCase()}
            </Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{asset.description}</Text>
          </View>
          <View style={styles.cardPriceBlock}>
            <Text style={[styles.cardPriceLabel, { color: type === 're' ? colors.secondary : colors.primary }]}>
              PRICE
            </Text>
            <Text style={styles.cardPriceValue}>
              {asset.cost.toLocaleString()}
              <Text style={styles.cardPriceCR}> CR</Text>
            </Text>
          </View>
        </View>

        {/* Attributes */}
        {type === 're' ? (
          <View style={styles.attrRow}>
            {asset.attributes.map((a) => (
              <View key={a.label} style={styles.attrChip}>
                <Text style={[styles.attrChipText, { color: accent }]}>
                  {a.label}: {a.value}
                </Text>
              </View>
            ))}
            {asset.incomePerTurn && (
              <View style={[styles.attrChip, { borderColor: colors.tertiaryFixed, borderWidth: 1 }]}>
                <Text style={[styles.attrChipText, { color: colors.tertiaryFixed }]}>
                  RENT: +{asset.incomePerTurn.toLocaleString()} CR/T
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.statBarsRow}>
            {asset.attributes.map((a) => (
              <View key={a.label} style={styles.statBarCell}>
                <Text style={styles.statBarLabel}>{a.label.toUpperCase()}</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: `${a.value}%`, backgroundColor: accent }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.assetBtn,
            {
              borderColor: btnAccent,
              backgroundColor: `${btnAccent}0D`,
              opacity: !isOwned && !canAfford ? 0.45 : 1,
            },
          ]}
          onPress={() => {
            if (isOwned) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLaunchMinigame(asset);
            } else if (canAfford) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPurchase(asset);
            }
          }}
          activeOpacity={0.8}
          disabled={!isOwned && !canAfford}
        >
          <MaterialIcons name={btnIcon} size={16} color={btnAccent} />
          <Text style={[styles.assetBtnText, { color: btnAccent }]}>{btnLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


function sortAssets(list, sort) {
  const sorted = [...list];
  if (sort === 'COST_ASC') sorted.sort((a, b) => a.cost - b.cost);
  else if (sort === 'COST_DESC') sorted.sort((a, b) => b.cost - a.cost);
  else if (sort === 'NAME') sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

// ─── AssetsTab ────────────────────────────────────────────────────────────────
function AssetsTab({ credits, ownedRealEstate, ownedVehicles, luxuryItems, onPurchase, onLaunchMinigame }) {
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [assetSort, setAssetSort] = useState('COST_DESC');

  const filteredRealEstate = useMemo(() => {
    let list = REAL_ESTATE;
    if (assetFilter === 'OWNED') list = list.filter(a => ownedRealEstate.includes(a.id));
    else if (assetFilter === 'UNOWNED') list = list.filter(a => !ownedRealEstate.includes(a.id));
    else if (assetFilter === 'VEHICLES') list = [];
    return sortAssets(list, assetSort);
  }, [assetFilter, assetSort, ownedRealEstate]);

  const filteredVehicles = useMemo(() => {
    let list = VEHICLES;
    if (assetFilter === 'OWNED') list = list.filter(a => ownedVehicles.includes(a.id));
    else if (assetFilter === 'UNOWNED') list = list.filter(a => !ownedVehicles.includes(a.id));
    else if (assetFilter === 'REAL_ESTATE') list = [];
    return sortAssets(list, assetSort);
  }, [assetFilter, assetSort, ownedVehicles]);

  const SORT_LABELS = { COST_DESC: 'COST \u2193', COST_ASC: 'COST \u2191', NAME: 'NAME' };
  const nextSort = assetSort === 'COST_DESC' ? 'COST_ASC' : assetSort === 'COST_ASC' ? 'NAME' : 'COST_DESC';

  const FILTERS = ['ALL', 'REAL_ESTATE', 'VEHICLES', 'OWNED', 'UNOWNED'];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <AssetsSummaryStrip reCount={ownedRealEstate.length} vehCount={ownedVehicles.length} lxCount={luxuryItems.length} />

      {/* Filter / Sort bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterChips}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, assetFilter === f && styles.filterChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAssetFilter(f); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, assetFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAssetSort(nextSort); }}
          activeOpacity={0.7}
        >
          <Text style={styles.sortBtnText}>{SORT_LABELS[assetSort]}</Text>
          <MaterialIcons name="sort" size={14} color={colors.outline} />
        </TouchableOpacity>
      </View>

      {filteredRealEstate.length > 0 && (assetFilter !== 'VEHICLES' || assetFilter === 'ALL') && (
        <View style={styles.section}>
          <SectionHeader index={1} label="REAL_ESTATE" accent={colors.primary} />
          {filteredRealEstate.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              type="re"
              accent={colors.primary}
              accentOn={colors.onPrimaryFixed}
              isOwned={ownedRealEstate.includes(asset.id)}
              credits={credits}
              onPurchase={onPurchase}
              onLaunchMinigame={onLaunchMinigame}
            />
          ))}
        </View>
      )}

      {filteredVehicles.length > 0 && (assetFilter !== 'REAL_ESTATE' || assetFilter === 'ALL') && (
        <View style={styles.section}>
          <SectionHeader index={2} label="VEHICLES" accent={colors.secondaryContainer} />
          {filteredVehicles.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              type="veh"
              accent={colors.secondaryContainer}
              accentOn={colors.onSecondaryFixed}
              isOwned={ownedVehicles.includes(asset.id)}
              credits={credits}
              onPurchase={onPurchase}
              onLaunchMinigame={onLaunchMinigame}
            />
          ))}
        </View>
      )}

      {filteredRealEstate.length === 0 && filteredVehicles.length === 0 && (
        <View style={styles.emptyFilter}>
          <Text style={styles.emptyFilterText}>[NO_MATCHING_ASSETS]</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── (Sparkline imported from components/Sparkline.js) ───────────────────────

// ─── PulsingDot ───────────────────────────────────────────────────────────────
function PulsingDot({ color }) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, anim]} />
  );
}

// ─── PortfolioSummaryStrip ────────────────────────────────────────────────────
function PortfolioSummaryStrip({ portfolioValue, credits, deltaPercent }) {
  const isUp = deltaPercent >= 0;
  const deltaColor = deltaPercent === 0 ? colors.outline : isUp ? colors.tertiaryFixedDim : colors.error;
  const deltaSign = deltaPercent > 0 ? '+' : '';

  return (
    <View style={styles.portfolioStrip}>
      <View style={styles.portfolioLeft}>
        {[
          { label: 'PORTFOLIO_VALUE', value: `${fmtCR(portfolioValue)} CR` },
          { label: 'LIQUID_CREDITS',  value: `${fmtCR(credits)} CR` },
        ].map((item) => (
          <View key={item.label} style={styles.portfolioBlock}>
            <Text style={styles.portfolioBlockLabel}>{item.label}</Text>
            <Text style={styles.portfolioBlockValue}>{item.value}</Text>
          </View>
        ))}
        <View style={styles.portfolioBlock}>
          <Text style={styles.portfolioBlockLabel}>24H_DELTA</Text>
          <Text style={[styles.portfolioBlockValue, { color: deltaColor }]}>
            {`${deltaSign}${deltaPercent.toFixed(2)}%`}
          </Text>
        </View>
      </View>
      <View style={styles.portfolioRight}>
        <Text style={styles.portfolioProtocol}>MARKET_PROTOCOL: ACTIVE</Text>
        <View style={styles.portfolioDotRow}>
          <PulsingDot color={colors.secondaryContainer} />
          <Text style={styles.portfolioDotLabel}>LIVE</Text>
        </View>
      </View>
    </View>
  );
}

// ─── CoinRow ──────────────────────────────────────────────────────────────────
const SPARK_W = 100;
const SPARK_H = 36;
const EXPAND_H = 80;

function CoinRow({ coinData, coinState, holding, onBuy, onSell }) {
  const [expanded, setExpanded] = useState(false);

  const history = coinState?.priceHistory || [coinData.basePrice];
  const currentPrice = coinState?.currentPrice || coinData.basePrice;
  const len = history.length;

  const windowUp = len >= 2 && history[len - 1] >= history[0];
  const sparkColor = windowUp ? colors.primary : colors.error;

  const pctChange = len >= 2 && history[0] > 0
    ? ((history[len - 1] - history[0]) / history[0]) * 100
    : 0;

  const hasHoldings = holding > 0.00001;
  const expandW = SCREEN_W - 48;

  return (
    <TouchableOpacity
      style={styles.coinRow}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.9}
    >
      {/* Symbol box */}
      <View style={styles.coinIconBox}>
        <Text style={styles.coinIconText}>{coinData.symbol.slice(0, 2)}</Text>
      </View>

      {/* Name + symbol */}
      <View style={styles.coinMeta}>
        <Text style={styles.coinSymbol}>{coinData.symbol}</Text>
        <Text style={styles.coinName} numberOfLines={1}>{coinData.name}</Text>
        {hasHoldings && (
          <Text style={styles.coinHolding}>{holding.toFixed(4)}</Text>
        )}
      </View>

      {/* Sparkline + 30T window % */}
      <View style={styles.coinChartBlock}>
        <Sparkline
          data={history}
          width={SPARK_W}
          height={SPARK_H}
          color={sparkColor}
          strokeWidth={1.5}
          fillBelow
          showLastDot
        />
        <View style={styles.coinWindowRow}>
          <Text style={[styles.coinWindowPct, { color: sparkColor }]}>
            {`${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}%`}
          </Text>
          <Text style={styles.coinWindowLabel}>30T_WINDOW</Text>
        </View>

        {/* Expanded chart */}
        {expanded && (
          <View style={styles.expandedChart}>
            <Sparkline
              data={history}
              width={expandW}
              height={EXPAND_H}
              color={sparkColor}
              strokeWidth={2}
              fillBelow
              showLastDot={false}
            />
            <View style={styles.expandedMeta}>
              <Text style={styles.expandedMetaText}>
                LOW: {Math.min(...history).toLocaleString()} CR
              </Text>
              <Text style={styles.expandedMetaText}>
                HIGH: {Math.max(...history).toLocaleString()} CR
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Price + buttons */}
      <View style={styles.coinRight}>
        <Text style={[styles.coinPrice, { color: sparkColor }]}>
          {currentPrice.toLocaleString()}
        </Text>
        <View style={styles.coinBtns}>
          <TouchableOpacity
            style={styles.coinBuyBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBuy(coinData.id);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.coinBuyText}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.coinSellBtn, !hasHoldings && styles.coinBtnOff]}
            onPress={(e) => {
              e.stopPropagation?.();
              if (!hasHoldings) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSell(coinData.id);
            }}
            activeOpacity={hasHoldings ? 0.8 : 1}
          >
            <Text style={[styles.coinSellText, !hasHoldings && { color: `${colors.secondary}33` }]}>
              SELL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── ExchangeTab ──────────────────────────────────────────────────────────────
function ExchangeTab({ credits, coins, holdings, portfolioValue, deltaPercent, onBuy, onSell }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PortfolioSummaryStrip portfolioValue={portfolioValue} credits={credits} deltaPercent={deltaPercent} />
      <View style={styles.coinList}>
        {COINS.map((c) => (
          <CoinRow
            key={c.id}
            coinData={c}
            coinState={coins[c.id]}
            holding={holdings[c.id] || 0}
            onBuy={onBuy}
            onSell={onSell}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── AchievementCard ──────────────────────────────────────────────────────────
function AchievementCard({ def, unlocked, accent, progress }) {
  const isHiddenLocked = def.hidden && !unlocked;
  const name = isHiddenLocked ? '???' : def.name;
  const desc = isHiddenLocked ? '[CLASSIFIED]' : def.description;

  // Account achievements grant a permanent perk; run achievements a one-time reward.
  const isAccountPerk = !!def.accountPerk;
  const rewardStr = def.reward?.credits
    ? `+${def.reward.credits.toLocaleString()} CR`
    : def.reward?.cyberwareId
    ? def.reward.cyberwareId.replace(/^cyb_/, '').toUpperCase()
    : def.reward?.recruitQuality
    ? `${def.reward.recruitQuality.toUpperCase()} RECRUIT`
    : null;

  return (
    <View
      style={[
        styles.achCard,
        unlocked
          ? { borderColor: accent, backgroundColor: `${accent}0D` }
          : styles.achCardLocked,
      ]}
    >
      <View style={styles.achIconBox}>
        <MaterialIcons
          name={unlocked ? 'verified' : isHiddenLocked ? 'help-outline' : 'lock'}
          size={22}
          color={unlocked ? accent : colors.outline}
        />
      </View>
      <View style={styles.achBody}>
        <View style={styles.achTopRow}>
          <Text
            style={[styles.achName, { color: unlocked ? accent : colors.outline }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {unlocked && (
            <View style={[styles.achStatusChip, { borderColor: accent }]}>
              <Text style={[styles.achStatusText, { color: accent }]}>✓ UNLOCKED</Text>
            </View>
          )}
        </View>
        <Text style={styles.achDesc} numberOfLines={2}>{desc}</Text>

        {/* Account: permanent perk line. Run: one-time reward line. */}
        {isAccountPerk && !isHiddenLocked && (
          <Text
            style={[
              styles.achPerk,
              { color: unlocked ? accent : colors.outline },
            ]}
            numberOfLines={2}
          >
            {unlocked ? '✓ ACTIVE_PERK: ' : 'PERK: '}{def.accountPerk.description}
          </Text>
        )}

        <View style={styles.achFooter}>
          {!isAccountPerk && rewardStr && !isHiddenLocked && (
            <Text style={[styles.achReward, { color: unlocked ? accent : colors.outline }]}>
              REWARD: {rewardStr}
            </Text>
          )}
          {!unlocked && !isHiddenLocked && progress && (
            <Text style={styles.achProgress}>{progress}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── CosmeticsSelector ──────────────────────────────────────────────────────
// Title is fully wired (shown on the game-over screen). HUD themes are unlockable
// and selectable but visually identical for now. TODO: full theming engine.
function CosmeticsSelector({ titles, themes, selectedTitle, selectedTheme, onSelectTitle, onSelectTheme }) {
  const activeTitle = selectedTitle ?? DEFAULT_TITLE;
  const activeTheme = selectedTheme ?? DEFAULT_THEME;

  const labelFor = (v) => v.replace(/^theme_/, '').toUpperCase();

  return (
    <View style={styles.cosmeticBlock}>
      <View>
        <Text style={styles.cosmeticLabel}>OPERATOR_TITLE</Text>
        <View style={styles.cosmeticChipRow}>
          {titles.map((t) => {
            const isActive = t === activeTitle;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.cosmeticChip, isActive && styles.cosmeticChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectTitle(t === DEFAULT_TITLE ? null : t);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.cosmeticChipText, isActive && styles.cosmeticChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={styles.cosmeticLabel}>HUD_THEME (COSMETIC // WIP)</Text>
        <View style={styles.cosmeticChipRow}>
          {themes.map((t) => {
            const isActive = t === activeTheme;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.cosmeticChip, isActive && styles.cosmeticChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectTheme(t);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.cosmeticChipText, isActive && styles.cosmeticChipTextActive]}>
                  {labelFor(t)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── AchievementsTab ────────────────────────────────────────────────────────
function AchievementsTab({
  state, accountUnlocked, runUnlocked, lifetime,
  selectedTitle, selectedTheme, onSelectTitle, onSelectTheme,
}) {
  const titles = getUnlockedTitles(state);
  const themes = getUnlockedThemes(state);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Cosmetics (titles fully wired; themes stubbed) */}
      <CosmeticsSelector
        titles={titles}
        themes={themes}
        selectedTitle={selectedTitle}
        selectedTheme={selectedTheme}
        onSelectTitle={onSelectTitle}
        onSelectTheme={onSelectTheme}
      />

      {/* Lifetime summary */}
      <View style={styles.achSummaryStrip}>
        <View style={styles.summaryLeft}>
          {[
            { label: 'Contracts (LT)', value: lifetime.contractsCompleted },
            { label: 'Max Team LV',    value: lifetime.maxTeamLevelReached },
            { label: 'Deaths',         value: lifetime.deaths },
          ].map((item) => (
            <View key={item.label} style={styles.summaryBlock}>
              <Text style={styles.summaryBlockLabel}>{item.label}</Text>
              <Text style={styles.summaryBlockValue}>{String(item.value).padStart(2, '0')}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryProtocol}>LIFETIME_CR</Text>
          <Text style={[styles.summaryBlockValue, { fontSize: 14, color: colors.tertiaryFixed }]}>
            {fmtCR(lifetime.totalCreditsEarned)}
          </Text>
        </View>
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <SectionHeader index={1} label="ACCOUNT_ACHIEVEMENTS" accent={colors.tertiaryFixed} />
        {ACCOUNT_ACHIEVEMENTS.map((def) => {
          const unlocked = accountUnlocked.includes(def.id);
          return (
            <AchievementCard
              key={def.id}
              def={def}
              unlocked={unlocked}
              accent={colors.tertiaryFixed}
              progress={!unlocked && def.progressHint ? def.progressHint(state) : null}
            />
          );
        })}
      </View>

      {/* Run section */}
      <View style={styles.section}>
        <SectionHeader index={2} label="RUN_ACHIEVEMENTS" accent={colors.primary} />
        <Text style={styles.achResetNote}>RESETS_ON_FLATLINE</Text>
        {RUN_ACHIEVEMENTS.map((def) => {
          const unlocked = runUnlocked.includes(def.id);
          return (
            <AchievementCard
              key={def.id}
              def={def}
              unlocked={unlocked}
              accent={colors.primary}
              progress={!unlocked && def.progressHint ? def.progressHint(state) : null}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── FactionCard ──────────────────────────────────────────────────────────────
function FactionCard({ faction, rep }) {
  const tier = repTierFromValue(rep);
  const accent = faction.accent;
  // Map [-100, 300] onto a 0–100% bar; 0 rep sits at ~25%.
  const pct = Math.round(((rep - REP_MIN) / (REP_MAX - REP_MIN)) * 100);
  const rivalTags = (faction.rivals || [])
    .map((rid) => FACTIONS[rid]?.tag)
    .filter(Boolean);

  return (
    <View style={[styles.facCard, { borderLeftColor: accent }]}>
      <View style={styles.facHeaderRow}>
        <View style={styles.facTitleBlock}>
          <Text style={[styles.facName, { color: accent }]}>{faction.name}</Text>
          <Text style={styles.facDomain}>{faction.domain.toUpperCase()}</Text>
        </View>
        <View style={[styles.facTagChip, { borderColor: accent }]}>
          <Text style={[styles.facTagText, { color: accent }]}>{faction.tag}</Text>
        </View>
      </View>

      <View style={styles.facRepRow}>
        <Text style={[styles.facTier, { color: accent }]}>{tier}</Text>
        <Text style={styles.facRepValue}>{rep > 0 ? `+${rep}` : rep}</Text>
      </View>
      <View style={styles.facBarTrack}>
        <View style={[styles.facBarFill, { width: `${Math.max(2, pct)}%`, backgroundColor: accent }]} />
      </View>

      <Text style={styles.facBlurb}>{faction.blurb}</Text>

      {rivalTags.length > 0 && (
        <Text style={styles.facRivals}>
          {'RIVAL: '}<Text style={{ color: colors.error }}>{rivalTags.join(', ')}</Text>
        </Text>
      )}
    </View>
  );
}

// ─── FactionsTab ──────────────────────────────────────────────────────────────
function FactionsTab({ rep }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.achSummaryStrip}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockLabel}>STANDINGS</Text>
            <Text style={styles.summaryBlockValue}>NIGHT_CITY</Text>
          </View>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryProtocol}>RESETS_ON_FLATLINE</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader index={1} label="FACTION_STANDINGS" accent={colors.primary} />
        {FACTION_LIST.map((f) => (
          <FactionCard key={f.id} faction={f} rep={rep[f.id] ?? 0} />
        ))}
      </View>
    </ScrollView>
  );
}


// ─── GiftPicker ───────────────────────────────────────────────────────────────
function GiftPicker({ visible, onPick, onCancel }) {
  if (!visible) return null;
  const opts = [
    { id: 'tech',   label: 'TECH',    icon: 'memory',        color: colors.tertiaryFixed },
    { id: 'luxury', label: 'LUXURY',  icon: 'diamond',       color: colors.secondaryFixed },
    { id: 'street', label: 'STREET',  icon: 'local-bar',     color: colors.secondary },
  ];
  return (
    <View style={relStyles.backdrop}>
      <View style={relStyles.giftModal}>
        <Text style={relStyles.giftTitle}>CHOOSE_GIFT</Text>
        {opts.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[relStyles.giftBtn, { borderColor: o.color }]}
            onPress={() => onPick(o.id)}
            activeOpacity={0.8}
          >
            <MaterialIcons name={o.icon} size={14} color={o.color} />
            <Text style={[relStyles.giftBtnText, { color: o.color }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={relStyles.giftCancel} onPress={onCancel} activeOpacity={0.8}>
          <Text style={relStyles.giftCancelText}>[CANCEL]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── RelationCard ─────────────────────────────────────────────────────────────
function RelationCard({ entity, kind, tier, pct, bond, accent, onOpen }) {
  const tierRank = (BOND_TIER_RANK[tier] ?? 0);
  const perks = getBondPerks(tierRank);

  return (
    <TouchableOpacity style={[relStyles.card, { borderLeftColor: accent }]} onPress={onOpen} activeOpacity={0.85}>
      {/* Header: name + faction tag */}
      <View style={relStyles.headerRow}>
        <View style={relStyles.titleBlock}>
          <Text style={[relStyles.name, { color: accent }]}>{entity.name || entity.handle}</Text>
          {entity.class && (
            <Text style={relStyles.role}>{entity.class.toUpperCase()}</Text>
          )}
          {entity.bio && (
            <Text style={relStyles.bio} numberOfLines={2}>{entity.bio}</Text>
          )}
        </View>
        {entity.tag && (
          <View style={[relStyles.tagChip, { borderColor: accent }]}>
            <Text style={[relStyles.tagText, { color: accent }]}>{entity.tag}</Text>
          </View>
        )}
      </View>

      {/* Heart */}
      <View style={relStyles.heartRow}>
        <MaterialIcons name="favorite" size={18} color={accent} />
      </View>

      {/* Bond bar */}
      <View style={relStyles.bondRow}>
        <Text style={[relStyles.tier, { color: accent }]}>{tier}</Text>
        <Text style={relStyles.bondValue}>{bond}</Text>
      </View>
      <View style={relStyles.barTrack}>
        <View style={[relStyles.barFill, { width: `${Math.max(2, pct)}%`, backgroundColor: accent }]} />
      </View>

      {/* Hidden perks */}
      {perks.length > 0 && (
        <View style={relStyles.perksRow}>
          {perks.map((p, i) => (
            <Text key={i} style={[relStyles.perkTag, { color: accent }]}>
              {p.tag}
            </Text>
          ))}
        </View>
      )}

      {/* Tap hint */}
      <View style={relStyles.tapHintRow}>
        <Text style={relStyles.tapHint}>TAP_TO_INTERACT</Text>
        <MaterialIcons name="chevron-right" size={14} color={colors.outline} />
      </View>
    </TouchableOpacity>
  );
}


// ─── InteractionMenu ──────────────────────────────────────────────────────────
function InteractionMenu({ entity, kind, tier, pct, bond, accent, credits, turnNumber, lastOutcome, onInteract, onFavor, onBack }) {
  const allowed = INTERACTIONS.filter((ix) => {
    if (kind === 'fixer') return ix.id === 'int_talk' || ix.id === 'int_gift';
    return true;
  });
  const tierRank = (BOND_TIER_RANK[tier] ?? 0);
  const perks = getBondPerks(tierRank);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Back button */}
      <TouchableOpacity style={relStyles.menuBack} onPress={onBack}>
        <MaterialIcons name="arrow-back" size={16} color={colors.primary} />
        <Text style={relStyles.menuBackText}>BACK</Text>
      </TouchableOpacity>

      {/* Header: card visuals */}
      <View style={[relStyles.card, { borderLeftColor: accent }]}>
        <View style={relStyles.headerRow}>
          <View style={relStyles.titleBlock}>
            <Text style={[relStyles.name, { color: accent }]}>{entity.name || entity.handle}</Text>
            {entity.class && (
              <Text style={relStyles.role}>{entity.class.toUpperCase()}</Text>
            )}
            {entity.bio && (
              <Text style={relStyles.bio} numberOfLines={4}>{entity.bio}</Text>
            )}
          </View>
          {entity.tag && (
            <View style={[relStyles.tagChip, { borderColor: accent }]}>
              <Text style={[relStyles.tagText, { color: accent }]}>{entity.tag}</Text>
            </View>
          )}
        </View>
        <View style={relStyles.heartRow}>
          <MaterialIcons name="favorite" size={18} color={accent} />
        </View>
        <View style={relStyles.bondRow}>
          <Text style={[relStyles.tier, { color: accent }]}>{tier}</Text>
          <Text style={relStyles.bondValue}>{bond}</Text>
        </View>
        <View style={relStyles.barTrack}>
          <View style={[relStyles.barFill, { width: `${Math.max(2, pct)}%`, backgroundColor: accent }]} />
        </View>
        {perks.length > 0 && (
          <View style={relStyles.perksRow}>
            {perks.map((p, i) => (
              <Text key={i} style={[relStyles.perkTag, { color: accent }]}>
                {p.tag}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Outcome banner */}
      {lastOutcome && lastOutcome.id === entity.id && (
        <View style={[relStyles.outcomeBanner, { borderLeftColor: (lastOutcome.intensity === 'rejected' || lastOutcome.intensity === 'insincere') ? colors.error : colors.tertiaryFixed }]}>
          <Text style={relStyles.outcomeText}>{lastOutcome.text}</Text>
          <Text style={relStyles.outcomeDelta}>{lastOutcome.bondDelta >= 0 ? '+' : ''}{lastOutcome.bondDelta} BOND</Text>
        </View>
      )}

      {/* Interaction rows */}
      {allowed.map((ix) => {
        const locked = ix.minTier && tierRank < (BOND_TIER_RANK[ix.minTier] ?? 0);
        const tooPoor = ix.creditCost > credits;
        const onCd = ix.cooldown && entity.lastBondTurn != null && (turnNumber - entity.lastBondTurn) < ix.cooldown;
        const disabled = locked || tooPoor || onCd;
        const meta = locked ? `LOCKED · ${ix.minTier}` : onCd ? 'COOLDOWN' : ix.creditCost > 0 ? `${ix.creditCost} CR` : '';
        return (
          <TouchableOpacity
            key={ix.id}
            style={[relStyles.menuRow, disabled && relStyles.btnDisabled, { borderLeftColor: accent }]}
            disabled={disabled}
            onPress={() => onInteract(ix.id)}
          >
            <MaterialIcons name={ix.icon} size={18} color={accent} />
            <View style={relStyles.menuRowText}>
              <Text style={[relStyles.menuRowLabel, { color: accent }]}>{ix.label}</Text>
              <Text style={relStyles.menuRowDesc}>{ix.desc}</Text>
            </View>
            {meta ? <Text style={relStyles.menuRowMeta}>{meta}</Text> : null}
          </TouchableOpacity>
        );
      })}

      {/* Favor row (friends only) */}
      {kind === 'friend' && onFavor && !entity.favorUsed && tierRank >= 3 && (
        <TouchableOpacity
          style={[relStyles.menuRow, { borderLeftColor: colors.tertiaryFixed }]}
          onPress={() => onFavor(entity.id)}
        >
          <MaterialIcons name="handshake" size={18} color={colors.tertiaryFixed} />
          <View style={relStyles.menuRowText}>
            <Text style={[relStyles.menuRowLabel, { color: colors.tertiaryFixed }]}>[CALL_FAVOR]</Text>
            <Text style={relStyles.menuRowDesc}>Cash in a one-time favor.</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
// ─── RelationsTab ─────────────────────────────────────────────────────────────
function RelationsTab({ crewMembers, friends, fixerRep, path, credits, onInteractCrew, onInteractFriend, onInteractFixer, onFavor, lastOutcome, turnNumber }) {
  const nonPlayerCrew = (crewMembers || []).filter((m) => !m.isPlayer && m.alive !== false && (m.vitals?.current ?? 1) > 0);
  const metFriends = Object.entries(friends || {}).filter(([, f]) => f.met);
  const [selected, setSelected] = useState(null); // { kind, id }

  // If a contact is selected, render InteractionMenu
  if (selected) {
    let menuEntity = null;
    let menuKind = null;
    let menuTier = null;
    let menuPct = null;
    let menuBond = null;
    let menuAccent = colors.primary;
    let menuLastBondTurn = null;

    if (selected.kind === 'crew') {
      const m = crewMembers.find((c) => c.id === selected.id);
      if (!m || m.alive === false || (m.vitals?.current ?? 0) <= 0) { setSelected(null); return null; }
      const b = m.bond ?? 0;
      const factionDef = FACTIONS[m.faction];
      menuEntity = { id: m.id, name: m.name, class: m.class, tag: factionDef?.tag, bio: m.backstory, favorUsed: false, lastBondTurn: m.lastBondTurn };
      menuKind = 'crew';
      menuTier = bondTierFromValue(b);
      menuPct = Math.round(((b - BOND_MIN) / (BOND_MAX - BOND_MIN)) * 100);
      menuBond = b;
      menuAccent = m.classColor || colors.primary;
    } else if (selected.kind === 'friend') {
      const friend = friends[selected.id];
      const friendDef = FRIENDS.find((f) => f.id === selected.id);
      if (!friend?.met || !friendDef) { setSelected(null); return null; }
      const b = friend.bond ?? 0;
      const factionDef = FACTIONS[friendDef.faction];
      menuEntity = { id: selected.id, name: friendDef.display || friendDef.name, tag: factionDef?.tag, bio: friendDef.bio, favorUsed: friend.favorUsed, lastBondTurn: friend.lastBondTurn };
      menuKind = 'friend';
      menuTier = bondTierFromValue(b);
      menuPct = Math.round(((b - BOND_MIN) / (BOND_MAX - BOND_MIN)) * 100);
      menuBond = b;
      menuAccent = factionDef?.accent || colors.secondary;
    } else if (selected.kind === 'fixer') {
      const f = FIXERS.find((x) => x.id === selected.id);
      if (!f) { setSelected(null); return null; }
      const rep = fixerRep?.[f.id] ?? 0;
      menuEntity = { id: f.id, name: f.name, handle: f.handle, tag: null, bio: f.bio };
      menuKind = 'fixer';
      menuTier = fixerTierFromRep(rep);
      menuPct = Math.min(100, Math.round((rep / 20) * 100));
      menuBond = rep;
      menuAccent = f.color;
    }

    return (
      <InteractionMenu
        entity={menuEntity}
        kind={menuKind}
        tier={menuTier}
        pct={menuPct}
        bond={menuBond}
        accent={menuAccent}
        credits={credits}
        turnNumber={turnNumber}
        lastOutcome={lastOutcome}
        onBack={() => setSelected(null)}
        onInteract={(iid, gc) => {
          if (selected.kind === 'crew') onInteractCrew(selected.id, iid, gc);
          else if (selected.kind === 'friend') onInteractFriend(selected.id, iid, gc);
          else onInteractFixer(selected.id, iid, gc);
        }}
        onFavor={onFavor}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Summary strip */}
      <View style={styles.achSummaryStrip}>
        <View style={styles.summaryLeft}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryBlockLabel}>PATH</Text>
            <Text style={styles.summaryBlockValue}>{(path || '').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryProtocol}>RELATIONSHIP_NETWORK</Text>
        </View>
      </View>

      {/* ── Crew ── */}
      <View style={styles.section}>
        <SectionHeader index={1} label="CREW" accent={colors.primary} />
        {nonPlayerCrew.length === 0 ? (
          <Text style={relStyles.empty}>NO_CREW — RECRUIT IN HAVEN</Text>
        ) : (
          nonPlayerCrew.map((m) => {
            const b = m.bond ?? 0;
            const tier = bondTierFromValue(b);
            const pct = Math.round(((b - BOND_MIN) / (BOND_MAX - BOND_MIN)) * 100);
            const factionDef = FACTIONS[m.faction];
            const entity = {
              id: m.id,
              name: m.name,
              class: m.class,
              tag: factionDef?.tag,
              bio: m.backstory,
              favorUsed: false,
              lastBondTurn: m.lastBondTurn,
            };
            return (
              <RelationCard
                key={m.id}
                entity={entity}
                kind="crew"
                tier={tier}
                pct={pct}
                bond={b}
                accent={m.classColor || colors.primary}
                onOpen={() => setSelected({ kind: 'crew', id: m.id })}
              />
            );
          })
        )}
      </View>

      {/* ── Friends ── */}
      <View style={styles.section}>
        <SectionHeader index={2} label="FRIENDS" accent={colors.secondary} />
        {metFriends.length === 0 ? (
          <Text style={relStyles.empty}>NO_FRIENDS_YET</Text>
        ) : (
          metFriends.map(([fid, friend]) => {
            const friendDef = FRIENDS.find((f) => f.id === fid);
            if (!friendDef) return null;
            const b = friend.bond ?? 0;
            const tier = bondTierFromValue(b);
            const pct = Math.round(((b - BOND_MIN) / (BOND_MAX - BOND_MIN)) * 100);
            const factionDef = FACTIONS[friendDef.faction];
            const entity = {
              id: fid,
              name: friendDef.display || friendDef.name,
              tag: factionDef?.tag,
              bio: friendDef.bio,
              favorUsed: friend.favorUsed,
              lastBondTurn: friend.lastBondTurn,
            };
            return (
              <RelationCard
                key={fid}
                entity={entity}
                kind="friend"
                tier={tier}
                pct={pct}
                bond={b}
                accent={factionDef?.accent || colors.secondary}
                onOpen={() => setSelected({ kind: 'friend', id: fid })}
              />
            );
          })
        )}
      </View>

      {/* ── Fixers ── */}
      <View style={styles.section}>
        <SectionHeader index={3} label="FIXERS" accent={colors.tertiaryFixed} />
        {FIXERS.map((f) => {
          const rep = fixerRep?.[f.id] ?? 0;
          const tier = fixerTierFromRep(rep);
          // Map fixer rep to a pct for the bar (max shown = 20)
          const pct = Math.min(100, Math.round((rep / 20) * 100));
          const entity = {
            id: f.id,
            name: f.name,
            handle: f.handle,
            tag: null,
            bio: f.bio,
          };
          return (
            <RelationCard
              key={f.id}
              entity={entity}
              kind="fixer"
              tier={tier}
              pct={pct}
              bond={rep}
              accent={f.color}
              onOpen={() => setSelected({ kind: 'fixer', id: f.id })}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
// ─── LifestyleScreen ──────────────────────────────────────────────────────────
export default function LifestyleScreen() {
  const [activeSubTab, setActiveSubTab] = useState('assets');
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [minigameAsset, setMinigameAsset] = useState(null);
  const [tradeTarget, setTradeTarget] = useState(null);

  const credits         = useStore((s) => s.character.credits);
  const ownedRealEstate = useStore((s) => s.character.realEstate) || [];
  const ownedVehicles   = useStore((s) => s.character.vehicles) || [];
  const luxuryItems     = useStore((s) => s.character.luxuryItems) || [];
  const coins           = useStore((s) => s.exchange.coins);
  const holdings        = useStore((s) => s.exchange.holdings);
  const portfolioStart  = useStore((s) => s.exchange.portfolioValueAtTurnStart);
  const purchaseAsset   = useStore((s) => s.purchaseAsset);
  const buyCoin         = useStore((s) => s.buyCoin);
  const sellCoin        = useStore((s) => s.sellCoin);

  const factionRep      = useStore((s) => s.faction.rep);
  const accountUnlocked = useStore((s) => s.achievements.account.unlocked);
  const runUnlocked     = useStore((s) => s.achievements.run.unlocked);
  const lifetime        = useStore((s) => s.achievements.lifetime);
  const unseenCount     = useStore((s) => s.achievements.unseen.length);
  const selectedTitle   = useStore((s) => s.achievements.account.selectedTitle);
  const selectedTheme   = useStore((s) => s.achievements.account.selectedTheme);
  const markAchievementsSeen = useStore((s) => s.markAchievementsSeen);
  const setSelectedTitle = useStore((s) => s.setSelectedTitle);
  const setSelectedTheme = useStore((s) => s.setSelectedTheme);
  const crewMembers      = useStore((s) => s.crew.members);
  const friends          = useStore((s) => s.relationship.friends);
  const fixerRep         = useStore((s) => s.contract.fixerRep);
  const path             = useStore((s) => s.character.path);
  const interactWithCrew  = useStore((s) => s.interactWithCrew);
  const interactWithFriend = useStore((s) => s.interactWithFriend);
  const interactWithFixer  = useStore((s) => s.interactWithFixer);
  const useFriendFavor     = useStore((s) => s.useFriendFavor);
  const lastOutcome        = useStore((s) => s.relationship.lastOutcome);
  const turnNumber         = useStore((s) => s.character.turnNumber);

  const [giftPickerTarget, setGiftPickerTarget] = useState(null); // { kind:'crew'|'friend'|'fixer', id:string }

  // Clear the unread dot when the achievements tab is opened
  useEffect(() => {
    if (activeSubTab === 'achievements' && unseenCount > 0) {
      markAchievementsSeen();
    }
  }, [activeSubTab, unseenCount, markAchievementsSeen]);

  const currentPortfolioValue = useMemo(
    () => COINS.reduce((sum, c) => sum + (holdings[c.id] || 0) * (coins[c.id]?.currentPrice || c.basePrice), 0),
    [holdings, coins],
  );

  const portfolioDeltaPct = portfolioStart > 0
    ? ((currentPortfolioValue - portfolioStart) / portfolioStart) * 100
    : 0;

  const handlePurchase = (asset) => setPendingPurchase(asset);

  const handleConfirmPurchase = () => {
    if (!pendingPurchase) return;
    const assetType = REAL_ESTATE.find((r) => r.id === pendingPurchase.id) ? 'realEstate' : 'vehicles';
    purchaseAsset(assetType, pendingPurchase.id, pendingPurchase.cost, pendingPurchase.name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingPurchase(null);
  };

  const handleTradeConfirm = (value) => {
    if (!tradeTarget) return;
    if (tradeTarget.mode === 'buy') buyCoin(tradeTarget.coinId, value);
    else sellCoin(tradeTarget.coinId, value);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTradeTarget(null);
  };

  const tradeCoin = tradeTarget ? COINS.find((c) => c.id === tradeTarget.coinId) : null;
  const tradeCoinState = tradeTarget ? coins[tradeTarget.coinId] : null;

  return (
    <View style={styles.root}>
      <View style={styles.tabBarWrap}>
        <SegmentedTabs
          active={activeSubTab}
          onSelect={setActiveSubTab}
          achievementsUnread={unseenCount > 0}
        />
      </View>

      {activeSubTab === 'assets' ? (
        <AssetsTab
          credits={credits}
          ownedRealEstate={ownedRealEstate}
          ownedVehicles={ownedVehicles}
          luxuryItems={luxuryItems}
          onPurchase={handlePurchase}
          onLaunchMinigame={setMinigameAsset}
        />
      ) : activeSubTab === 'factions' ? (
        <FactionsTab rep={factionRep} />
      ) : activeSubTab === 'relations' ? (
        <RelationsTab
          crewMembers={crewMembers}
          friends={friends}
          fixerRep={fixerRep}
          path={path}
          credits={credits}
          onInteractCrew={(memberId, interactionId, giftCat) => {
            if (interactionId === 'int_gift') {
              setGiftPickerTarget({ kind: 'crew', id: memberId });
            } else {
              interactWithCrew(memberId, interactionId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          onInteractFriend={(friendId, interactionId, giftCat) => {
            if (interactionId === 'int_gift') {
              setGiftPickerTarget({ kind: 'friend', id: friendId });
            } else {
              interactWithFriend(friendId, interactionId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          onInteractFixer={(fixerId, interactionId, giftCat) => {
            if (interactionId === 'int_gift') {
              setGiftPickerTarget({ kind: 'fixer', id: fixerId });
            } else {
              interactWithFixer(fixerId, interactionId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          onFavor={useFriendFavor}
          lastOutcome={lastOutcome}
          turnNumber={turnNumber}
        />
      ) : activeSubTab === 'achievements' ? (
        <AchievementsTab
          state={useStore.getState()}
          accountUnlocked={accountUnlocked}
          runUnlocked={runUnlocked}
          lifetime={lifetime}
          selectedTitle={selectedTitle}
          selectedTheme={selectedTheme}
          onSelectTitle={setSelectedTitle}
          onSelectTheme={setSelectedTheme}
        />
      ) : (
        <ExchangeTab
          credits={credits}
          coins={coins}
          holdings={holdings}
          portfolioValue={currentPortfolioValue}
          deltaPercent={portfolioDeltaPct}
          onBuy={(coinId) => setTradeTarget({ coinId, mode: 'buy' })}
          onSell={(coinId) => setTradeTarget({ coinId, mode: 'sell' })}
        />
      )}

      <ConfirmModal
        visible={pendingPurchase !== null}
        variant="neutral"
        title="INITIATE_PURCHASE"
        body={`Acquire ${pendingPurchase?.name || ''} for ${pendingPurchase?.cost?.toLocaleString() || 0} CR? Funds will be transferred immediately.`}
        confirmLabel="[EXECUTE_TRANSACTION]"
        cancelLabel="[ABORT]"
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPendingPurchase(null)}
      />

      <MinigameStub
        visible={minigameAsset !== null}
        asset={minigameAsset}
        onClose={() => setMinigameAsset(null)}
      />

      {tradeTarget !== null && tradeCoin !== null && (
        <TradeModal
          visible
          mode={tradeTarget.mode}
          coinData={tradeCoin}
          currentPrice={tradeCoinState?.currentPrice || tradeCoin.basePrice}
          holdings={holdings[tradeTarget.coinId] || 0}
          credits={credits}
          onConfirm={handleTradeConfirm}
          onCancel={() => setTradeTarget(null)}
        />
      )}

      <GiftPicker
        visible={giftPickerTarget !== null}
        onPick={(category) => {
          if (!giftPickerTarget) return;
          const { kind, id } = giftPickerTarget;
          if (kind === 'crew') interactWithCrew(id, 'int_gift', category);
          else if (kind === 'friend') interactWithFriend(id, 'int_gift', category);
          else if (kind === 'fixer') interactWithFixer(id, 'int_gift', category);
          setGiftPickerTarget(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onCancel={() => setGiftPickerTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  tabBarWrap: {
    paddingTop: BANNER_H,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  segTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
  },
  segTabActive: {
    backgroundColor: `${colors.primary}0F`,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segTabText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  segTabTextActive: { color: colors.primary },
  segTabDot: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiaryFixed,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: NAV_H + 16,
    gap: 16,
  },

  // Assets summary strip
  summaryStrip: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondaryContainer,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryLeft: { flexDirection: 'row', gap: 16 },
  summaryBlock: { gap: 2 },
  summaryBlockLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryBlockValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 18,
    color: colors.primaryFixedDim,
  },
  summaryBlockMax: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
  },
  summaryRight: { alignItems: 'flex-end', gap: 4 },
  summaryProtocol: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryBarBg: {
    width: 80,
    height: 4,
    backgroundColor: `${colors.secondaryContainer}22`,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    backgroundColor: colors.secondaryContainer,
  },

  // Asset filter / sort bar
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}14`,
  },
  filterChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filterChipTextActive: { color: colors.primary },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sortBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  emptyFilter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyFilterText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1,
  },

  // Faction standings card
  facCard: {
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
    borderLeftWidth: 3,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    gap: 8,
  },
  facHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  facTitleBlock: { gap: 2, flex: 1 },
  facName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  facDomain: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  facTagChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  facTagText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  facRepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facTier: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  facRepValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.onSurface,
    letterSpacing: 0.8,
  },
  facBarTrack: {
    height: 5,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  facBarFill: {
    height: '100%',
  },
  facBlurb: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  facRivals: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Section
  section: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 15,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },

  // Asset card
  assetCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    position: 'relative',
  },
  listingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  serialBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  ownedChip: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 3,
  },
  badgeText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  imgPlaceholder: {
    alignSelf: 'stretch',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitleBlock: { flex: 1, gap: 4 },
  cardName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  cardPriceBlock: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  cardPriceLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cardPriceValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    color: colors.onSurface,
  },
  cardPriceCR: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
  },

  // Attribute chips (real estate)
  attrRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attrChip: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attrChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Stat bars (vehicles)
  statBarsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBarCell: {
    flex: 1,
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    padding: 8,
  },
  statBarLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statBarTrack: {
    height: 4,
    backgroundColor: colors.outlineVariant,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  statBarFill: { height: 4 },

  // Asset action button
  assetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 13,
  },
  assetBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Portfolio strip (exchange)
  portfolioStrip: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondaryContainer,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  portfolioLeft: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  portfolioBlock: { gap: 2 },
  portfolioBlockLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  portfolioBlockValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 16,
    color: colors.primaryFixedDim,
  },
  portfolioRight: { alignItems: 'flex-end', gap: 6 },
  portfolioProtocol: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  portfolioDotRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  portfolioDotLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.secondary,
    letterSpacing: 1.5,
  },

  // Coin list
  coinList: { gap: 1 },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 10,
    gap: 8,
  },
  coinIconBox: {
    width: 32,
    height: 32,
    backgroundColor: `${colors.primary}14`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coinIconText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coinMeta: { width: 48, gap: 2, flexShrink: 0 },
  coinSymbol: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  coinName: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.3,
  },
  coinChartBlock: { flex: 1, gap: 4 },
  coinWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinWindowPct: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  coinWindowLabel: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.8,
  },
  expandedChart: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: 4,
  },
  expandedMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  expandedMetaText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.5,
  },
  coinRight: { alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  coinPrice: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  coinHolding: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 0.3,
  },
  coinBtns: { flexDirection: 'row', gap: 4 },
  coinBuyBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  coinBuyText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 1,
  },
  coinSellBtn: {
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  coinSellText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.secondary,
    letterSpacing: 1,
  },
  coinBtnOff: {
    borderColor: `${colors.secondary}33`,
  },

  // Achievements
  achSummaryStrip: {
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiaryFixed,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  achResetNote: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: `${colors.error}99`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: -6,
  },
  achCard: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  achCardLocked: {
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    opacity: 0.7,
  },
  achIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    flexShrink: 0,
  },
  achBody: { flex: 1, gap: 4 },
  achTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  achName: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  achStatusChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  achStatusText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1,
  },
  achDesc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  achFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  achReward: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  achPerk: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 14,
    marginTop: 2,
  },
  // Cosmetics selector
  cosmeticBlock: {
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiaryFixed,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    gap: 10,
  },
  cosmeticLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cosmeticChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cosmeticChip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cosmeticChipActive: {
    borderColor: colors.tertiaryFixed,
    backgroundColor: `${colors.tertiaryFixed}14`,
  },
  cosmeticChipText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cosmeticChipTextActive: {
    color: colors.tertiaryFixed,
  },
  achProgress: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─── Relationship styles ─────────────────────────────────────────────────────
const relStyles = StyleSheet.create({
  // Card
  card: {
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
    borderLeftWidth: 3,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBlock: { gap: 2, flex: 1 },
  name: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  role: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bio: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  tagChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // Bond bar
  bondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tier: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bondValue: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 14,
    color: colors.onSurface,
  },
  barTrack: {
    height: 5,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  // Perks
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  perkTag: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
  },
  // Heart
  heartRow: { alignItems: 'center', paddingVertical: 2 },
  // Tap hint
  tapHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  tapHint: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // Interaction menu
  menuBack: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  menuBackText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  outcomeBanner: {
    borderLeftWidth: 3,
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    gap: 4,
  },
  outcomeText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  outcomeDelta: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1,
  },
  btnDisabled: { opacity: 0.4 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: `${colors.outline}4D`,
    borderLeftWidth: 3,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
  },
  menuRowText: { flex: 1, gap: 2 },
  menuRowLabel: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuRowDesc: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  menuRowMeta: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 8,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Empty state
  empty: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingVertical: 20,
    textAlign: 'center',
  },
  // Gift picker
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  giftModal: {
    width: SCREEN_W * 0.7,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: 20,
    gap: 12,
  },
  giftTitle: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    color: colors.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  giftBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  giftBtnText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  giftCancel: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  giftCancelText: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
