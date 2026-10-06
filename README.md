# agro — farm to buyer

A produce market for Sri Lankan farmers, buyers and transporters, with the price
agreed before collection. React Native (Expo SDK 57) + Firebase.

Design and data model: `../M03 data model and setup.md`. The UI follows **Prototype v3** and
**Entry - Onboarding v3** (Plus Jakarta Sans + Bricolage Grotesque, forest-green app bar, lime
accents); `theme.js` holds those values and every screen reads from it.

## Stack

| Layer | Choice |
|---|---|
| App | Expo SDK 57, Expo Router (file-based routes in `app/`) |
| Auth | Firebase phone + OTP, via React Native Firebase |
| Data | Cloud Firestore, offline persistence on by default (native SDK) |
| Files | Firebase Storage — collection photos, dispute evidence |
| State | React Context (`lib/auth.js`, `lib/i18n.js`) + Firestore listeners |

React Native Firebase uses native code, so **the app does not run in Expo Go**.
You install a development build once, then `npm start` hot-reloads JS as usual.

## First-time setup

1. **Node 20+** and a real Android phone with USB debugging, or an emulator.
2. `npm install`
3. **Firebase project** (one person does this, then shares):
   - Create the project; enable **Authentication → Phone**, **Firestore**, **Storage**.
   - Project settings → Add an Android app with package `lk.agro.farmdirect`.
   - Download `google-services.json` into this folder and commit it.
   - Authentication → Sign-in method → Phone → **Phone numbers for testing**, add:

     | Number | Code | Seeded as |
     |---|---|---|
     | +94 77 400 0321 | 123456 | Sunil Perera, farmer (Kasun operates) |
     | +94 77 555 0142 | 123456 | Ranjith Stores, buyer |
     | +94 71 123 4567 | 123456 | Nimal Jayasinghe, transporter |

     Test numbers need no SMS quota and no Blaze plan.
4. **Development build** (per person, once — or share one APK):
   ```sh
   npx eas-cli@latest login
   npm run build:dev          # cloud build, gives an APK link to install
   ```
   With Android Studio installed you can instead run `npm run android`.
5. `npm start`, then open the installed **agro** dev build and pick the server.

## Seed data

Uses the prototype's own figures (Sunil, beans Grade A 200 kg, Ranjith Stores at
Rs 192/kg, AG-2214, OR-8841, DP-1190) so screenshots match the prototype.

```sh
# Firebase console → Project settings → Service accounts → Generate new private key
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
```

The key file is git-ignored. Never commit it.

## Security rules

`firestore.rules` and `storage.rules` are deployed with:

```sh
npx firebase-tools login
npx firebase-tools use <project-id>
npm run deploy:rules
```

There is no catch-all rule; anything not explicitly allowed is denied.

## Building the submission APK

Locally (needs Android Studio's SDK; keeps the same signing key, so the SHA
fingerprints already registered in Firebase keep working):

```sh
npx expo prebuild --platform android     # only after changing app.json or adding a native package
cd android
./gradlew app:assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
# → android/app/build/outputs/apk/release/app-release.apk
```

Or in the cloud. EAS signs with its own key: add that build's SHA-1 and SHA-256
(`npx eas-cli credentials`) to the Firebase Android app, or phone sign-in fails.

```sh
npm run build:apk          # EAS "preview" profile, installable APK
```

The APK is signed with the shared debug key — fine for coursework and sideloading,
not for the Play Store.

## Layout

```
app/                        routes (Expo Router)
  index.jsx                 S00a splash: waits for auth, redirects by role
  (auth)/                   welcome, sign-in, verify, register
  (farmer)/(tabs)/          home, listings, offers, money   + bottom nav
  (farmer)/                 listing-new, agreement/[id], collection/[id], sale/[id] (retail order),
                            profile (account — opened from the profile button on Home)
  (buyer)/(tabs)/           search, orders, account (profile)
  (buyer)/                  listing/[id] (checkout + whole-lot offer), order/[id] (tracking),
                            payment/[id] (payment not completed), problem/[id]
  (transport)/(tabs)/       jobs, transport-account (profile)
  (transport)/              collect/[id]
components/                 shared UI — use these, do not restyle per screen
lib/
  actions.js                every multi-field / multi-document write (accept offer, record weight, …)
  auth.js                   useAuth(): user, profile, status, sendCode, confirmCode, signOut
  firestore.js              collection names, ROLE_HOME, registration helpers
  useFirestore.js           useQuery / useDocument live reads, with `fromCache` for offline
  money.js                  formatLKR, calcNet — the ONLY place money is formatted
  dates.js                  'Tuesday, 8 September', '7.00 am' — locale-independent
  market.js                 crops, grades, price guidance, delivery / transport fees
  photos.js                 camera + Storage upload for evidence photos
  i18n.js                   useI18n(): t(key), language, setLanguage
theme.js                    colours, type, spacing — from the prototype CSS
scripts/seed.mjs            seed data
```

Screens under `(tabs)/` show the bottom nav; screens beside `(tabs)/` push on top
of it with a back arrow.

## Rules everyone follows

- Money: always `formatLKR()`, always `color.ink`, never coloured.
- Orange (`harvest`) means time pressure and nothing else.
- Nothing tappable below `TAP_MIN` (52).
- Store `netToFarmer`; never recompute it in a screen.
- Text: always `import Text from components/Text`, never from `react-native`. It
  translates and sets Sinhala in Noto Sans Sinhala (see *Sinhala / English* below).
- Every farmer screen renders `<OwnerStrip />` under its app bar.

## Data model additions (beyond the M03 document)

- `users.registration` `{ step, savedBy, savedAt }` while sign-up is unfinished — resumable registration.
- `agreements` also stores `farmerName`, `buyerName`, `transporterName`, `crop`, `grade`,
  `paymentTerms`, `grossTotal`, `feeAmount`, `netToFarmer` (copied from the accepted offer, so
  no screen recomputes money), and `farmerWeightKg` when a weight is disputed.
- `jobs.farmerName`, `jobs.transporterName`, `jobs.orderId` (a retail delivery rather than an agreement).
- `orders.buyerName`, `farmerVillage`, `deliverTo`, `grade`, `goodsTotal`, `feeAmount`, `netToFarmer`
  (stored, like offers), `paymentFailure`, `reservedUntil`, `transporterId`, `transporterName`;
  status also `cancelled`.
- `problems.farmerName`.
- Order and problem refunds are pro rata of what the buyer paid: 2 of 10 kg of Rs 2,150 = Rs 430.

## Sinhala / English (NFR-04)

gettext style: **the English text is the key**, and `lib/strings.si.js` maps it to Sinhala.
Anything missing falls back to English.

- Plain text needs nothing. `components/Text.jsx` looks up each plain string child, so
  `<Text>What do you do?</Text>` and props like `<Button title="Next" />` translate themselves.
- Text built from values uses one whole sentence with placeholders, so Sinhala word order can
  differ: `t('Ends in {time}', { time })`. Never glue translated fragments together.
- Dates (`lib/dates.js`), money (`Rs` → `රු.`) and crop names follow the language automatically.
- Adding a string: write it in English in the screen, then add the same English as a key in
  `lib/strings.si.js`. The catalogue is a first draft — have a native speaker review it.

## Flows

- **Bulk sale:** listing → buyer offer → farmer accepts (agreement + transport job) → transporter
  records weight and photos → farmer confirms → paid.
- **Retail order:** buyer pays at checkout (money held) → farmer accepts on *Sale* (delivery job) or
  declines (refund) → transporter collects, delivers → buyer confirms within 2 hours or reports a problem.

## What is simulated

- **Sign-in codes** (`lib/demo.js`, `DEMO_SIGN_IN = true`). No SMS is sent: any Sri Lankan
  mobile number registers or signs in with the code **123456**. Each number still gets its own
  Firebase account (an email and password derived from the number), so the same number is the
  same account on every phone. Needs **Authentication → Sign-in method → Email/Password** enabled.
  It is not secure — anyone who knows a number can sign in as it — and exists because real SMS
  needs Firebase's paid plan. Set the flag to `false` for real SMS codes.

- **Payments** (`lib/payments.js`). Nothing is charged. Mobile wallets behave as if the buyer's
  balance were **Rs 25,000**: a larger payment fails with "insufficient balance" and opens
  *Payment not completed* (order 150 kg of beans or more to demonstrate it). Bank transfer always succeeds.
- **Payout timing.** An agreement on 7-day terms stays `collected` after the weight is confirmed;
  set it to `paid` in the console to show the paid state (on-collection terms pay out immediately).
- **Price guidance** is a static table in `lib/market.js`.
- **Offline splash.** Probes `clients3.google.com/generate_204`; no connection shows
  *Cannot reach the market* with *Continue without internet*.
