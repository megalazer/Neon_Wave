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
import { Dimensions } from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import MinigameStub from '../components/MinigameStub';
import TradeModal from '../components/TradeModal';
import Sparkline from '../components/Sparkline';
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
    { id: 'assets', label: 'ASSETS' },
    { id: 'exchange', label: 'EXCHANGE' },
    { id: 'achievements', label: 'TROPHIES', dot: achievementsUnread },
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
      <View style={styles.summaryRight}>
        <Text style={styles.summaryProtocol}>ACTIVE_PROTOCOL: ASSET_ACQUISITION</Text>
        <View style={styles.summaryBarBg}>
          <View style={[styles.summaryBarFill, { width: '66%' }]} />
        </View>
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

// ─── AssetsTab ────────────────────────────────────────────────────────────────
function AssetsTab({ credits, ownedRealEstate, ownedVehicles, luxuryItems, onPurchase, onLaunchMinigame }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <AssetsSummaryStrip reCount={ownedRealEstate.length} vehCount={ownedVehicles.length} lxCount={luxuryItems.length} />

      <View style={styles.section}>
        <SectionHeader index={1} label="REAL_ESTATE" accent={colors.primary} />
        {REAL_ESTATE.map((asset) => (
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

      <View style={styles.section}>
        <SectionHeader index={2} label="VEHICLES" accent={colors.secondaryContainer} />
        {VEHICLES.map((asset) => (
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

  const accountUnlocked = useStore((s) => s.achievements.account.unlocked);
  const runUnlocked     = useStore((s) => s.achievements.run.unlocked);
  const lifetime        = useStore((s) => s.achievements.lifetime);
  const unseenCount     = useStore((s) => s.achievements.unseen.length);
  const selectedTitle   = useStore((s) => s.achievements.account.selectedTitle);
  const selectedTheme   = useStore((s) => s.achievements.account.selectedTheme);
  const markAchievementsSeen = useStore((s) => s.markAchievementsSeen);
  const setSelectedTitle = useStore((s) => s.setSelectedTitle);
  const setSelectedTheme = useStore((s) => s.setSelectedTheme);

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  segTabActive: {
    backgroundColor: `${colors.primary}0F`,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segTabText: {
    fontFamily: 'KodeMono_700Bold',
    fontSize: 11,
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
