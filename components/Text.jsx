// Drop-in replacement for React Native's Text. Use it everywhere instead of
// importing Text from 'react-native'. It does two things:
//   1. In Sinhala, looks each plain string child up in the catalogue (lib/i18n).
//   2. Sets Sinhala script in Noto Sans Sinhala at the same weight, with a taller
//      line height — the app fonts have no Sinhala glyphs and Android fallback breaks
//      the vowel signs. Latin text keeps the prototype's own fonts.
// It also sets textBreakStrategy="simple": Android's default strategy mis-measures
// these custom fonts and clips the last word of short labels ("Verified buyer").
import { Children } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { lookup, useI18n } from '../lib/i18n';
import { font, sinhalaFont } from '../theme';

const SINHALA = /[඀-෿]/;

function translateChildren(children) {
  if (typeof children === 'string') return lookup(children);
  if (Array.isArray(children)) return Children.map(children, (c) => (typeof c === 'string' ? lookup(c) : c));
  return children;
}

function hasSinhala(children) {
  if (typeof children === 'string') return SINHALA.test(children);
  if (Array.isArray(children)) return children.some((c) => typeof c === 'string' && SINHALA.test(c));
  return false;
}

export default function Text({ children, style, ...rest }) {
  const { language } = useI18n();
  const content = language === 'si' ? translateChildren(children) : children;
  if (!hasSinhala(content)) {
    return (
      <RNText style={style} textBreakStrategy="simple" {...rest}>
        {content}
      </RNText>
    );
  }
  const flat = StyleSheet.flatten(style) ?? {};
  const family = sinhalaFont[flat.fontFamily] ?? sinhalaFont[font.regular];
  return (
    <RNText
      style={[style, { fontFamily: family }, flat.lineHeight ? { lineHeight: Math.round(flat.lineHeight * 1.25) } : null]}
      textBreakStrategy="simple"
      {...rest}
    >
      {content}
    </RNText>
  );
}
