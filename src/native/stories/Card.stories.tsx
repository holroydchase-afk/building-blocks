// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Card, Txt } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/Card', component: Card };

const render = () => (
  <Card>
    <Txt variant="title3" role="header">A group of related content</Txt>
    <Txt>A card is only padding and a gap: no fill, no outline.</Txt>
  </Card>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
