// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Card, Notice } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/Notice', component: Notice };

const render = () => (
  <Card>
    <Notice text="Your changes are saved." tone="good" onClose={noop} />
    <Notice text="Heads up: this list updates every minute." />
  </Card>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
