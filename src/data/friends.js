// Life-path friends. Social NPCs only — no combat, no crew slot.
// One friend per origin path (corpo / street_kid / nomad).
// Id prefix: frn_

export const FRIENDS = [
  {
    id: 'frn_rico',
    name: 'Rico_Calavera',
    handle: 'RICO_CALAVERA',
    display: 'RICO',
    path: 'street_kid',
    faction: 'fac_undertow',
    accent: 'secondary',
    icon: 'sports-mma',
    giftTaste: 'street',
    bio: 'Your choom from the Saltgate days. All muscle, all heart, zero filter.',
    introNarration:
      'LOG: Rico claps you on the back outside the underpass. "Knew you\'d crawl back to the strip, choom. Try not to die without me."',
    favor: {
      id: 'fav_rico_backup',
      label: '[CALL_BACKUP]',
      desc: 'Rico crashes your next job — +1,500 CR',
      effect: { credits: 1500, morale: 4 },
    },
  },
  {
    id: 'frn_viv',
    name: 'Vivienne_Osei',
    handle: 'V_OSEI',
    display: 'VIV',
    path: 'corpo',
    faction: 'fac_grammaton',
    accent: 'primary',
    icon: 'business-center',
    giftTaste: 'luxury',
    bio: 'Old colleague from inside the tower. Still has clearance and grudges.',
    introNarration:
      'LOG: A private channel opens. Viv, poised as ever. "You went off-grid. Bold. I kept your seat warm — and your secrets."',
    favor: {
      id: 'fav_viv_intel',
      label: '[PULL_STRINGS]',
      desc: 'Viv leaks corp intel — +2,000 CR',
      effect: { credits: 2000, morale: 3 },
    },
  },
  {
    id: 'frn_sol',
    name: 'Sol_Mbeki',
    handle: 'SOL_OVERLAND',
    display: 'SOL',
    path: 'nomad',
    faction: 'fac_signal',
    accent: 'tertiary',
    icon: 'local-shipping',
    giftTaste: 'tech',
    bio: 'Clan-kin from the badlands convoys. Owes you road-debt, pays in fuel and favors.',
    introNarration:
      'LOG: Sol\'s convoy idles at the periphery. "City\'s a cage, kin. But the road remembers you. Take what you need."',
    favor: {
      id: 'fav_sol_supply',
      label: '[SUPPLY_DROP]',
      desc: 'Sol drops gear — +1,200 CR',
      effect: { credits: 1200, morale: 5 },
    },
  },
];

export function getFriend(id) {
  return FRIENDS.find((f) => f.id === id) ?? null;
}

export function getFriendForPath(path) {
  return FRIENDS.find((f) => f.path === path) ?? null;
}
