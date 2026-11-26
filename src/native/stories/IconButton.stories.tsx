// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Card, IconButton } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/IconButton', component: IconButton };

const render = () => (
  <Card>
    <IconButton label="Add an item" text="Add" icon={{ sf: 'plus', md: 'add' }} onPress={noop} />
    <IconButton label="Close this window" text="Close" icon={{ sf: 'xmark', md: 'close' }} onPress={noop} />
  </Card>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
