# createNavContext

## What it is for
Screens call a small `Nav` interface (open, close, go home) instead of a router. The app wires the Provider to its router; tests pass spies.

## Usage
```tsx
interface Nav { close(): void; goHome(): void }
export const { Provider: NavProvider, useNav } = createNavContext<Nav>('Nav');
// in a screen: const nav = useNav(); nav.close();
```
`useNav` throws "Nav context missing" when no Provider is above.

## Do and don't
**Do** describe your own routes in the interface. **Don't** import the router in screens.
