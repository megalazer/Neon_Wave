import { COINS } from '../../data/coins';

const HISTORY_CAP = 30;

function generateBackdatedHistory(basePrice, volatility, points = 30) {
  let price = basePrice;
  const backward = [];

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    price = price / (1 + change);
    price = Math.max(basePrice * 0.3, Math.min(basePrice * 2.5, price));
    backward.unshift(Math.round(price));
  }

  backward.push(Math.round(basePrice));
  return backward;
}

function buildInitialState() {
  const coins = {};
  const holdings = {};
  COINS.forEach((c) => {
    coins[c.id] = {
      currentPrice: c.basePrice,
      priceHistory: generateBackdatedHistory(c.basePrice, c.volatility, HISTORY_CAP),
    };
    holdings[c.id] = 0;
  });
  return { coins, holdings };
}

const { coins: initialCoins, holdings: initialHoldings } = buildInitialState();

export const createExchangeSlice = (set) => ({
  exchange: {
    coins: initialCoins,
    holdings: initialHoldings,
    portfolioValueAtTurnStart: 0,
    marketEvents: [],
  },

  tickPrices: () =>
    set((state) => {
      let snapshot = 0;
      COINS.forEach((c) => {
        snapshot += state.exchange.holdings[c.id] * state.exchange.coins[c.id].currentPrice;
      });
      state.exchange.portfolioValueAtTurnStart = snapshot;

      COINS.forEach((c) => {
        const coin = state.exchange.coins[c.id];
        const swing = (Math.random() * 2 - 1) * c.volatility;
        const newPrice = Math.max(
          Math.round(c.basePrice * 0.01),
          Math.round(coin.currentPrice * (1 + swing)),
        );
        coin.currentPrice = newPrice;
        coin.priceHistory.push(newPrice);
        if (coin.priceHistory.length > HISTORY_CAP) {
          coin.priceHistory.shift();
        }
      });
    }),

  buyCoin: (coinId, creditsToSpend) =>
    set((state) => {
      if (creditsToSpend <= 0 || state.character.credits < creditsToSpend) return;
      const coin = state.exchange.coins[coinId];
      const amount = creditsToSpend / coin.currentPrice;
      state.exchange.holdings[coinId] += amount;
      state.character.credits -= creditsToSpend;
      const coinMeta = COINS.find((c) => c.id === coinId);
      state.log.entries.push({
        id: `exch_buy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `ACQUISITION: Purchased ${amount.toFixed(4)} ${coinMeta.symbol} @ ${coin.currentPrice.toLocaleString()} CR. -${creditsToSpend.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  sellCoin: (coinId, amountToSell) =>
    set((state) => {
      if (amountToSell <= 0 || state.exchange.holdings[coinId] < amountToSell) return;
      const coin = state.exchange.coins[coinId];
      const proceeds = Math.round(amountToSell * coin.currentPrice);
      state.exchange.holdings[coinId] -= amountToSell;
      state.character.credits += proceeds;
      const coinMeta = COINS.find((c) => c.id === coinId);
      state.log.entries.push({
        id: `exch_sell_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        turn: state.character.turnNumber,
        text: `LIQUIDATION: Sold ${amountToSell.toFixed(4)} ${coinMeta.symbol} @ ${coin.currentPrice.toLocaleString()} CR. +${proceeds.toLocaleString()} CR.`,
        timestamp: new Date().toISOString(),
        type: 'acquisition',
      });
    }),

  // FUTURE: called by quests/events to spike or crash a coin
  triggerMarketEvent: (coinId, multiplier) =>
    set((state) => {
      const coin = state.exchange.coins[coinId];
      coin.currentPrice = Math.round(coin.currentPrice * multiplier);
      coin.priceHistory.push(coin.currentPrice);
      if (coin.priceHistory.length > HISTORY_CAP) {
        coin.priceHistory.shift();
      }
    }),
});
