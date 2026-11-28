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
- `safeMessage` is for logs, not for screens. Add the words your app knows are private (a caption, a name) in `scrub`.
- The problem log is for builds you control: turn it on with `enabled`, so the people who use the app never see it. Nothing is written to storage or sent.
- An error report carries the app version, the system, a plain screen name, the error type and a plain code, never the message.

## Do and don't
**Do** give `loadFailedWords` the name of a real person to call, or nothing.
**Don't** log a message that has not been through `safeMessage`, and don't put a phone number or address in a screen name.
