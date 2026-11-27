# ErrorBoundary

## What it is for
The last line of defense: a plain sentence and a "Try again" button instead of a crash or a stack trace.

## Usage
```tsx
<ErrorBoundary helper="Sam" screen="Home" onError={(e, screen) => report(e.name, e.code, screen)}>
  <App />
</ErrorBoundary>
```
Props: `helper` (who to call), `screen` (name passed to `onError`), `onError(error, screen)` where `error` is `{ name, code? }` only, and `title`, `message`, `retryLabel` to use your own words.

## Do and don't
**Do** de-duplicate in your reporter: "Try again" re-renders the same children, so a deterministic failure calls `onError` again.
**Don't** show the error to the person; the boundary never does.

## Security note
The console and `onError` both get only the error's type (and, for `onError`, a short string `code`), never its message or stack, which can hold a caption, URL or email. A throwing or rejecting `onError` is swallowed so a report can never cause a second error.
