# ErrorBoundary

## What it is for
The last line of defense: a plain sentence and a "Try again" button instead of a crash or a stack trace.

## Usage
```tsx
<ErrorBoundary helper="Sam" screen="Home" onError={(e, screen) => report(e, screen)}>
  <App />
</ErrorBoundary>
```
Props: `helper` (who to call), `screen` (name passed to `onError`), `onError(error, screen)`, and `title`, `message`, `retryLabel` to use your own words.

## Do and don't
**Do** keep `onError` free of user content: send the error's type and code, not its message.
**Don't** show the error to the person; the boundary never does.

## Security note
Only the error's type (`error.name`) is written to the console, never its message, which can hold a caption, URL or email. A throwing or rejecting `onError` is swallowed so a report can never cause a second error.
