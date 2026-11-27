// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { createContext, useContext, type Context } from 'react';

/**
 * Navigation as the screens see it. A product describes its own routes as an interface, wires the Provider to its
 * router, and tests hand the Provider spies. `name` is only used in the error when no Provider is above.
 */
export function createNavContext<Nav>(name: string): { NavContext: Context<Nav | null>; Provider: Context<Nav | null>['Provider']; useNav: () => Nav } {
  const NavContext = createContext<Nav | null>(null);
  function useNav(): Nav {
    const n = useContext(NavContext);
    if (!n) throw new Error(`${name} context missing`);
    return n;
  }
  return { NavContext, Provider: NavContext.Provider, useNav };
}
