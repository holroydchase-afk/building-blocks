# secureSession

> **The web twin is sealed, and its options differ from the phone's.** On web each value is sealed with AES-256-GCM into localStorage; the key is a non-extractable WebCrypto key kept in IndexedDB. When IndexedDB, WebCrypto or localStorage is unavailable, values live in memory for the visit and nothing is written in plain text. The web factory takes `{ keys, legacyKeys? }`, not the phone's `{ kv, keys, prefix }`.

## What it is for
Keeping a sign-in session on the device. Sessions can be bigger than a secure store likes (about 2 KB), so the value is encrypted with AES-256-GCM into a `KV` and only the 32-byte key lives in the secure store.

## Usage
```ts
import { createSecureSessionStorage, secureSessionStorage, memoryKV } from '@holroyd/building-blocks/platform';

// Phone default: blob in AsyncStorage, key in expo-secure-store, names prefixed `bb_`.
await secureSessionStorage.setItem('session', json);

// Tests or custom wiring: inject the KV and key store.
const store = createSecureSessionStorage({ kv: memoryKV(), keys, prefix: 'app_' });
```
The blob is stored as base64 of nonce (12) + ciphertext + tag (16) under `<prefix>s_<name>`; the key under `<prefix>k_<name>` with unsafe characters replaced by `_`.

## Do and don't
**Do**
- Use one prefix per app so two stores never collide.
- Expect `null` from `getItem` for a missing, moved or tampered value.

**Don't**
- Don't pass the phone's options to the web factory; the two signatures differ.
- Don't log the value or the key.

## Security note
Each item has its own random AES-256-GCM key, created on first write and kept in the Keychain or Keystore through expo-secure-store; each write uses a fresh 12-byte nonce. A tampered or moved blob fails authentication and reads as `null`. This does not protect a phone that is unlocked and compromised, a rooted or jailbroken device, or the value after your code has read it into memory. Removing an item deletes both the blob and its key. 
### Web twin
- Values are sealed under the `hs.` prefix with the value's name bound as additional data; the key is created on first write and never leaves WebCrypto.
- `legacyKeys` is a pattern for plain-text names an older build wrote through this store. On first use every match is sealed and its plain copy removed, even when sealing fails (then the value lives in memory for the visit).
- `sealBytes(name, bytes)` and `openBytes(name, sealed)` use the same key for byte stores such as queued uploads. `sealBytes` returns `null` rather than plain bytes when it cannot seal.
- `clear()` removes every sealed value and deletes the key, so bytes sealed earlier can no longer be opened.
- `indexedDbKeyStore(idb, dbName)`: pass the database name an earlier build used so an existing key is found again.
- A value that will not open (tampered, wrong name, key gone) reads as `null`.
- Not protected: a page script that can already call WebCrypto with the key while the page is open.
