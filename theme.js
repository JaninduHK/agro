// Values are taken from the Prototype v2 CSS, not approximated.
// Three rules from the research, not from taste:
//   1. Money is always `ink` and never coloured.
//   2. `harvest` (orange) means time pressure and nothing else.
//   3. No tap target goes below TAP_MIN.

export const color = {
  ink:         '#14170F',  // body text, primary buttons, EVERY money figure
  muted:       '#6B6B63',  // secondary text
  faint:       '#9B9B92',  // hints, timestamps, unselected radios
  paper:       '#FFFFFF',  // cards
  canvas:      '#F4F3EE',  // screen background
  surface:     '#F6F5F1',  // inset panels, neutral chips
  field:       '#2F6B3C',  // app bar, active nav, confirmed
  fieldDark:   '#24522E',  // pressed state
  fieldLight:  '#E8F0E7',  // owner strip, selected rows
  fieldBorder: '#C9DBC7',
  harvest:     '#C8641E',  // TIME PRESSURE ONLY — expiring, weight shortfall
  harvestBg:   '#FBEEE4',
  harvestText: '#7F3C0F',
  harvestBorder: '#EFD5BF',
  alert:       '#A32D2D',  // errors, disputes, unverified
  alertBg:     '#FCF7F7',
  alertChip:   '#F7E8E8',
  alertBorder: '#E3CFCF',
  disabledBg:  '#E7E5DE',  // a button that cannot be pressed yet
  disabledText: '#4F4F47',
  line:        '#DCDAD2',  // borders, empty rail segments
  lineStrong:  '#CFCBBF',  // secondary button border
  lineSoft:    '#E6E3DB',  // inputs, option cards
  lineFaint:   '#ECEAE3',  // card borders
  divider:     '#EFEDE7',
  onField:     'rgba(255,255,255,0.82)', // subtitle text on the app bar
};

// Families are registered in app/_layout.jsx. On Android a custom font needs
// one family per weight — fontWeight alone does not switch the face.
export const font = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

// Inter has no Sinhala glyphs, and Android's automatic fallback breaks Sinhala
// vowel signs. Sinhala text must be set in Noto Sans Sinhala explicitly — use
// `useI18n().scriptFont(font.x)`, which returns the right family for the language.
export const sinhalaFont = {
  [font.regular]: 'NotoSansSinhala_400Regular',
  [font.medium]: 'NotoSansSinhala_500Medium',
  [font.semibold]: 'NotoSansSinhala_600SemiBold',
  [font.bold]: 'NotoSansSinhala_700Bold',
};

// Prototype class in the comment.
export const type = {
  display: { fontFamily: font.bold,     fontSize: 34, lineHeight: 40, letterSpacing: -1.2 },  // .d32 — money only
  title:   { fontFamily: font.bold,     fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },  // .t22
  appbar:  { fontFamily: font.semibold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: font.semibold, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },  // .h17
  button:  { fontFamily: font.semibold, fontSize: 16, lineHeight: 20 },                      // .btn
  body:    { fontFamily: font.regular,  fontSize: 15, lineHeight: 22 },                      // .b15
  label:   { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },                      // .eyebrow, .chip
  caption: { fontFamily: font.regular,  fontSize: 12, lineHeight: 17 },                      // .c12
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = {
  card: 22,     // .card
  row: 18,      // .rowc
  option: 20,   // selectable option cards
  control: 16,  // .btn, .btn2
  input: 14,    // text inputs, inset panels
  nav: 24,      // .nav
  pill: 999,
};

export const shadow = {
  card: { shadowColor: color.ink, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  nav:  { shadowColor: color.ink, shadowOpacity: 0.2,  shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  btn:  { shadowColor: color.ink, shadowOpacity: 0.35, shadowRadius: 9,  shadowOffset: { width: 0, height: 6 },  elevation: 3 },
};

export const TAP_MIN = 52;
