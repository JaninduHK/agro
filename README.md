# agro

A mobile marketplace that connects Sri Lankan farmers directly with buyers and
transporters. The farmer lists produce, a buyer makes an offer or places an order,
and a transporter collects and delivers it. The price is agreed before collection,
so the farmer knows what they will receive before the produce leaves the farm.

The app supports three roles (farmer, buyer, transporter) and works in English and
Sinhala. Each account has one role, chosen at registration.

## Tech stack

| Layer | What we use |
|---|---|
| Mobile app | React Native 0.86 with Expo SDK 57 |
| Navigation | Expo Router (file based routes in `app/`) |
| Sign in | Firebase Authentication, phone number with a one time code |
| Database | Cloud Firestore, with offline persistence |
| File storage | Firebase Storage, for collection and problem photos |
| Firebase SDK | React Native Firebase v26 (native modules) |
| State | React Context for auth and language, Firestore listeners for data |
| UI | Custom components, react-native-svg, Plus Jakarta Sans and Bricolage Grotesque |
| Tooling | ESLint, EAS and Gradle for builds, Firebase Admin SDK for seed data |

## System architecture

There is no custom backend server. The app talks to Firebase directly, and Firestore
security rules decide what each signed in user can read and write.

```
+---------------------------------------------------+
|                 agro mobile app                   |
|                                                   |
|   Screens (app/)          one folder per role     |
|        |                                          |
|   Components              shared UI building      |
|        |                  blocks                  |
|   lib/                    auth, actions, money,   |
|        |                  dates, i18n, photos     |
|   React Native Firebase   native SDK, local cache |
+--------|------------------------------------------+
         |
         v
+---------------------------------------------------+
|                    Firebase                       |
|                                                   |
|   Authentication     who the user is              |
|   Cloud Firestore    users, listings, offers,     |
|                      agreements, orders, jobs,    |
|                      problems                     |
|   Storage            photos                       |
|   Security rules     who can read or change what  |
+---------------------------------------------------+
```

How the pieces work together:

- **Screens** only display data and collect input. They read live data through the
  `useQuery` and `useDocument` hooks, so a change made on one phone shows up on the
  others without a refresh.
- **Writes go through `lib/actions.js`.** Anything that touches more than one
  document, such as accepting an offer (which creates an agreement and a transport
  job), is done there in a single transaction or batch.
- **Security rules are the real access control.** For example, only the farmer who
  owns a listing can edit it, a transporter can only record the weight on a job
  they claimed, and the payout account can only be changed right after a fresh
  sign in.
- **Offline support** comes from Firestore's local cache. Screens show a banner when
  they are displaying saved data, and the splash screen offers to continue without
  internet.
- **Routing by role.** After sign in, `app/index.jsx` reads the user's profile and
  sends them to the home screen for their role. Each role folder has a guard so a
  buyer cannot open farmer screens.

## Getting started

### What you need

- Node.js 20 or newer
- Android Studio with an emulator, or an Android phone with USB debugging turned on
- Access to the Firebase project (ask a team member), or your own project set up as
  described below

The app uses native Firebase modules, so it does not run in Expo Go. You build a
development version once and after that code changes reload instantly.

### 1. Install

```sh
git clone https://github.com/JaninduHK/agro.git
cd agro
npm install
```

### 2. Connect Firebase

If you are using the team project, get `google-services.json` from a team member and
put it in the project root.

To use your own Firebase project instead:

1. Create a project in the Firebase console.
2. Turn on Authentication (Phone and Email/Password), Firestore and Storage.
3. Add an Android app with the package name `com.agro.farmtobuyer`.
4. Download `google-services.json` into the project root.
5. Deploy the security rules:
   ```sh
   npx firebase-tools login
   npx firebase-tools use <your-project-id>
   npm run deploy:rules
   ```

### 3. Run the app

Start an emulator or plug in a phone, then:

```sh
npm run android
```

The first run compiles the native app and takes several minutes. After that, use
this to start the dev server and open the installed app:

```sh
npm start
```

### 4. Add sample data (optional)

The seed script fills the database with a farmer, a buyer, a transporter and some
listings, offers and orders, which is useful for trying every screen.

1. In the Firebase console go to Project settings, Service accounts, and generate a
   new private key.
2. Save the file in the project root. It is ignored by git and must never be
   committed.
3. Run:
   ```sh
   GOOGLE_APPLICATION_CREDENTIALS=./<key-file>.json npm run seed
   ```

Seeded accounts:

| Phone number | Account |
|---|---|
| 077 400 0321 | Sunil Perera, farmer |
| 077 555 0142 | Ranjith Stores, buyer |
| 071 123 4567 | Nimal Jayasinghe, transporter |

In this build the sign in code for every number is `123456`.

### 5. Build an APK

```sh
npx expo prebuild -p android
cd android
./gradlew app:assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.
The prebuild step is only needed after changing `app.json` or adding a native
package.

### Other commands

```sh
npm run lint      # check code style
npm run doctor    # check the Expo setup and dependency versions
```

## File layout

```
app/                         screens, one file per route
  _layout.jsx                root layout: fonts, auth and language providers
  index.jsx                  splash screen, sends the user to their role's home
  (auth)/                    welcome, sign in, enter code, register
  (farmer)/
    (tabs)/                  home, listings, offers, money
    listing-new.jsx          create a listing
    agreement/[id].jsx       review and accept an offer
    collection/[id].jsx      confirm the collected weight, see the payout
    sale/[id].jsx            accept or decline a retail order
    profile.jsx              farmer account
  (buyer)/
    (tabs)/                  search, orders, account
    listing/[id].jsx         listing detail, make an offer, checkout
    order/[id].jsx           track an order
    payment/[id].jsx         retry a payment that did not go through
    problem/[id].jsx         report a problem with a delivery
  (transport)/
    (tabs)/                  jobs, account
    collect/[id].jsx         record weight and photos at collection

components/                  shared UI: buttons, cards, app bar, tab bar,
                             form fields, timeline, profile screen

lib/
  auth.js                    sign in state and the useAuth hook
  firestore.js               collection names and registration helpers
  useFirestore.js            live read hooks (useQuery, useDocument)
  actions.js                 all multi document writes
  money.js                   currency formatting and fee calculation
  dates.js                   date and time formatting
  market.js                  crops, grades, price guidance, transport fees
  i18n.js                    language switching
  strings.si.js              Sinhala translations
  photos.js                  camera and photo upload
  payments.js                payment handling
  network.js                 connection check

theme.js                     colours, fonts, spacing, corner radius
firebase.js                  Firebase setup
firestore.rules              database security rules
storage.rules                file storage security rules
firestore.indexes.json       database indexes
scripts/seed.mjs             sample data
app.json                     Expo app configuration
eas.json                     cloud build profiles
```

Folders in brackets such as `(farmer)` group screens by role and do not appear in
the route path. Screens inside `(tabs)` show the bottom navigation bar. Screens next
to `(tabs)` open on top of it with a back button.

## Team

| Member | Area |
|---|---|
| Sahanya | Registration, farmer home, offers, agreements, collection, earnings |
| Athuraliya | Splash, welcome, sign in and code entry, farmer listings |
| Ranaweera | Buyer search, checkout, payments, orders, problem reports |
| Karanayaka | Transporter jobs and collection, shared components, project setup |
