export function getUnlockedTiers(teamLevel) {
  const tiers = ['basic'];
  if (teamLevel >= 4) tiers.push('intermediate');
  if (teamLevel >= 7) tiers.push('elite');
  return tiers;
}

export function fmtCredits(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(Math.floor(n / 100) / 10).toFixed(1)}K`;
  return n.toLocaleString();
}
