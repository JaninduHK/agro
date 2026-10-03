// Values are taken from the Prototype v3 CSS, not approximated.
// Three rules from the research, not from taste:
//   1. Money is always `ink` and never coloured.
//   2. Amber / `harvest` means time pressure and nothing else.
//   3. No tap target goes below TAP_MIN.

export const color = {
  ink:         '#101A13',  // body text, EVERY money figure
  muted:       '#5E6A61',  // secondary text
  faint:       '#9B9B92',  // hints, unselected radios
  paper:       '#FFFFFF',  // cards
  canvas:      '#F7F4EC',  // screen background
  surface:     '#F1EDE3',  // inset panels, neutral chips
  forest:      '#0E2A1C',  // app bar, primary buttons, splash
  forestPressed: '#16382A',
  field:       '#2E6B3A',  // accents: links, selected borders, done ticks, active tab text
  fieldDark:   '#24552E',  // text on fieldLight chips
  fieldLight:  '#E9F5DA',  // owner strip, selected rows, done chips
  fieldBorder: '#D3E6BF',
  lime:        '#B7E36B',  // active tab pill, selected-role tick, splash progress
  amberBg:     '#FFF1D6',  // TIME PRESSURE chips — "Ends in 4 hours", "Happening now"
  amberText:   '#7A4700',
  amberIcon:   '#9A5B00',
  harvest:     '#C8641E',  // the "now" ring on timelines, quantity-check icon
  harvestBg:   '#FBEEE4',
  harvestText: '#7F3C0F',
  harvestBorder: '#EFD5BF',
  alert:       '#B3261E',  // errors, disputes, offline app bar
  alertBg:     '#FBE9E7',
  alertChip:   '#FBE9E7',
  alertText:   '#8C1D18',
  alertBorder: '#F2C9C4',
  skyBg:       '#E4EEF7',  // transporter icon tile
  skyIcon:     '#1F5A8A',
  line:        '#E2DCCD',  // empty rail segments, timeline track
  lineStrong:  '#D9D3C3',  // secondary button border
  lineSoft:    '#ECE6D8',  // inputs, option cards
  lineFaint:   '#ECE6D8',  // card borders
  radio:       '#CFC8B6',  // unselected role radio
  divider:     '#EFEADF',
  disabledBg:  '#E7E5DE',  // a button that cannot be pressed yet
  disabledText: '#4F4F47',
  onField:     'rgba(255,255,255,0.82)', // subtitle text on the app bar
};

// Families are registered in app/_layout.jsx. On Android a custom font needs
// one family per weight — fontWeight alone does not switch the face.
// Body: Plus Jakarta Sans. Display (titles, money): Bricolage Grotesque.
export const font = {
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semibold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
  display:   'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
};

// Neither family has Sinhala glyphs, and Android's automatic fallback breaks
// Sinhala vowel signs. components/Text.jsx swaps to Noto Sans Sinhala at the
// matching weight whenever the text contains Sinhala script.
export const sinhalaFont = {
  [font.regular]: 'NotoSansSinhala_400Regular',
  [font.medium]: 'NotoSansSinhala_500Medium',
  [font.semibold]: 'NotoSansSinhala_600SemiBold',
  [font.bold]: 'NotoSansSinhala_700Bold',
  [font.extrabold]: 'NotoSansSinhala_700Bold',
  [font.display]: 'NotoSansSinhala_700Bold',
  [font.displayHeavy]: 'NotoSansSinhala_700Bold',
};

// Prototype class in the comment.
export const type = {
  display: { fontFamily: font.displayHeavy, fontSize: 34, lineHeight: 40, letterSpacing: -1.0 },  // .d32 — money only
  hero:    { fontFamily: font.display,  fontSize: 30, lineHeight: 36, letterSpacing: -0.75 },     // onboarding headlines
  title:   { fontFamily: font.display,  fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },      // .t22
  appbar:  { fontFamily: font.display,  fontSize: 22, lineHeight: 28, letterSpacing: -0.44 },
  heading: { fontFamily: font.display,  fontSize: 17, lineHeight: 24, letterSpacing: -0.17 },     // .h17
  button:  { fontFamily: font.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.08 },     // .btn
  body:    { fontFamily: font.regular,  fontSize: 15, lineHeight: 22 },                           // .b15
  label:   { fontFamily: font.bold,     fontSize: 13, lineHeight: 18, letterSpacing: 0.13 },      // .eyebrow
  chip:    { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },                           // .chip
  caption: { fontFamily: font.regular,  fontSize: 12, lineHeight: 17 },                           // .c12
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const radius = {
  card: 24,     // .card
  row: 20,      // .rowc
  option: 20,   // selectable option cards
  control: 18,  // .btn, .btn2
  input: 14,    // text inputs, inset panels, choice tiles
  nav: 28,      // .nav
  sheet: 26,    // bottom action sheet
  pill: 999,
};

export const shadow = {
  card: { shadowColor: color.ink, shadowOpacity: 0.14, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
  nav:  { shadowColor: color.ink, shadowOpacity: 0.2,  shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  btn:  { shadowColor: color.forest, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  sheet: { shadowColor: color.ink, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
};

export const TAP_MIN = 52;
