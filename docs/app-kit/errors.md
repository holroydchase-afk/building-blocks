# errors

## What it is for
The error helpers an app needs on day one, with nothing private in them: a message scrubber, an error report that cannot carry what a person typed, a problem log for the people building the app, and the words for a list that failed to load.

## Usage
```ts
import { buildErrorReport, classifyError, createProblemLog, describeOs, loadFailedWords, loadFailure, safeMessage } from '@holroyd/building-blocks/app-kit';

safeMessage(error.message, [caption]);   // no urls, keys, emails, phone numbers, paths, quoted text or coordinates
buildErrorReport(error, 'home/[id]', { appVersion, os: describeOs(Platform.OS, Platform.Version) }); // type and code only
const words = loadFailedWords(loadFailure(error), { helper: 'Sam', reassure: 'Your things are safe.' });

const problems = createProblemLog({ enabled: () => debugBuild, appVersion, runtime: sdk, platform: () => os, updateId: () => updates.updateId, title: 'Problem details' });
problems.record(error, 'list: load');    // last 20, in memory only; never throws
problems.text();                         // one plain block to copy
```

## Rules
- Server text is never shown to a person: use `classifyError` (NETWORK, AUTH, a plain code, or UNKNOWN) to choose your own words.
- `safeMessage` is for logs, not for screens, and it is best effort: it removes urls, hosts with paths, keys, tokens, `Bearer` values, emails, phone numbers, IP addresses, paths, quoted text and coordinates, but it cannot know a name or an address. Add every word your app knows is private (a caption, a name) in `scrub`; matching ignores case and line breaks. Only the first 1,000 characters are looked at, so a huge server page cannot stall the app.
- `buildErrorReport` keeps a screen only if it is a route template such as `post/[id]` (a resolved id is replaced by `unknown`), and the version and system only if they look like a version and `ios 18`, `android 15` or `web`.
- Nothing here throws, even for a hostile error object; a `ref` for a log entry must be a plain id.
- The problem log is for builds you control: turn it on with `enabled`, so the people who use the app never see it. Nothing is written to storage or sent.
- An error report carries the app version, the system, a plain screen name, the error type and a plain code, never the message.

## Do and don't
**Do** give `loadFailedWords` the name of a real person to call, or nothing.
**Don't** log a message that has not been through `safeMessage`, and don't put a phone number or address in a screen name.
