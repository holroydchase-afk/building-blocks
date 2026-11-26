// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Button, Screen, Txt } from '..';
import { DARK, EASY, LIGHT, Frame, noop } from './helpers';

export default { title: 'Native/Screen', component: Screen };

const render = () => (
  <Frame>
    <Screen footer={<Button label="Save changes" text="Save" onPress={noop} />}>
      <Txt variant="largeTitle" role="header">A screen</Txt>
      <Txt>Content scrolls; the footer stays put, always on screen.</Txt>
    </Screen>
  </Frame>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
