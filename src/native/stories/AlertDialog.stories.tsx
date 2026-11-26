// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { AlertDialog } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/AlertDialog', component: AlertDialog };

const render = () => (
  <AlertDialog title="Delete this item?" body="It cannot be undone." keep="Keep it" destroy="Delete" onKeep={noop} onDestroy={noop} />
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
