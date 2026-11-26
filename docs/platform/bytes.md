# bytes

## What it is for
`readBytes(uri)`: the bytes behind a picker result or a data, blob or web address. The only function in this layer that touches the network, and only for an address the caller passes.

## Usage
```ts
import { readBytes } from '@holroyd/building-blocks/platform';

const bytes = await readBytes(uri);
```
`data:`, `blob:` and `http(s):` use fetch; other values are local files read with expo-file-system on a phone. The web twin always uses fetch.

## Do and don't
**Do**
- Catch errors: a missing file or failed fetch rejects.

**Don't**
- Don't pass untrusted addresses without checking them first.
