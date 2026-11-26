# secureSession

> **Warning: the web twin is plain text.** On web this stores values unencrypted in localStorage (or memory when storage is blocked). Do not keep real-user sessions in it in a production web build; use it only for demos and tests.

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
- Don't use the web twin for real secrets: it is plain localStorage.
- Don't log the value or the key.

## Security note
Each item has its own random AES-256-GCM key, created on first write and kept in the Keychain or Keystore through expo-secure-store; each write uses a fresh 12-byte nonce. A tampered or moved blob fails authentication and reads as `null`. This does not protect a phone that is unlocked and compromised, a rooted or jailbroken device, or the value after your code has read it into memory. Removing an item deletes both the blob and its key. The web twin does not protect anything.
