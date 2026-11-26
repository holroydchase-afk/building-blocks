# storage

> **Warning: the web twin is plain text.** On web this stores values unencrypted in localStorage (or memory when storage is blocked). Do not keep real-user sessions in it in a production web build; use it only for demos and tests.

## What it is for
`asyncStorageKV`: the phone's AsyncStorage behind the `KV` interface. On web the `.web.ts` twin uses localStorage with the same keys, so one import works everywhere.

## Usage
```ts
import { asyncStorageKV } from '@holroyd/building-blocks/platform';

await asyncStorageKV.setItem('lastTab', 'home');
const tab = await asyncStorageKV.getItem('lastTab');
```

## Do and don't
**Do**
- Keep values small strings (stringify JSON yourself).
- Install the peer `@react-native-async-storage/async-storage`.

**Don't**
- Don't store secrets or tokens here; use `secureSessionStorage`.
