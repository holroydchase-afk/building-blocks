// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Card, Txt } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/Txt', component: Txt };

const render = () => (
  <Card>
    <Txt variant="largeTitle" role="header">Large title</Txt>
    <Txt variant="title2" role="header">Section title</Txt>
    <Txt>Body text is the default style and the one to read at length.</Txt>
    <Txt tone="muted">Muted words for secondary detail.</Txt>
    <Txt tone="accent" emphasized>Accent, emphasized.</Txt>
    <Txt tone="danger">Danger words for a destructive choice.</Txt>
    <Txt variant="footnote" tone="muted">Footnote: smaller styles are for secondary words only.</Txt>
  </Card>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
