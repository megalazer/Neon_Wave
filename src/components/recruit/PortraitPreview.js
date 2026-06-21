import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PORTRAIT_PIECES } from '../../data/portraitAssets';
import { portraitClassKey } from '../../engine/portraitGenerator';
import { pieceId, pieceScopeFor, LAYER_ORDER } from '../../data/portraitTraits';

// Naive back-to-front stack of pre-baked layer sprites. Portrait pieces are baked
// offline by scripts/gen_portrait_pieces.mjs; this composites them instantly with
// no network. Missing pieces (unbaked manifest) are skipped; if nothing resolves
// a hint placeholder renders so the lab is usable before any bake.
export default function PortraitPreview({
  character,
  portrait,
  size = 180,
  borderColor = colors.outlineVariant,
  backgroundColor = colors.background,
  fallbackIcon = 'person',
  showMissingHint = size >= 128,
  style,
  imageStyle,
  resizeMode = 'contain',
}) {
  const layers = Array.isArray(portrait?.layers) ? portrait.layers : [];
  const sources = LAYER_ORDER.map((name) => {
    const l = layers.find((x) => x.layer === name);
    if (!l) return null;
    const id = pieceId(pieceScopeFor(portraitClassKey(character?.class), l.layer), l.layer, l.rarity, l.index);
    const src = PORTRAIT_PIECES[id];
    return src ? { key: l.layer, src } : null;
  }).filter(Boolean);

  const sizeStyle = Number.isFinite(size) ? { width: size, height: size } : null;

  return (
    <View style={[styles.frame, sizeStyle, { borderColor, backgroundColor }, style]}>
      {sources.length > 0 ? (
        sources.map(({ key, src }) => (
          <Image key={key} source={src} resizeMode={resizeMode} style={[StyleSheet.absoluteFill, imageStyle]} />
        ))
      ) : showMissingHint ? (
        <Text style={styles.placeholder}>[ NO PIECES — run npm run gen:portrait-pieces ]</Text>
      ) : (
        <MaterialIcons name={fallbackIcon} size={Math.max(12, Math.round(size * 0.52))} color={colors.outline} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    fontFamily: 'KodeMono_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
