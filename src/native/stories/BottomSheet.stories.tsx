// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { BottomSheet, MenuRow } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/BottomSheet', component: BottomSheet };

const render = () => (
  <BottomSheet testID="sheet" label="Sort options" onClose={noop}>
    <MenuRow text="Newest first" icon={{ sf: 'arrow.down', md: 'arrow_downward' }} onPress={noop} />
    <MenuRow text="Oldest first" icon={{ sf: 'arrow.up', md: 'arrow_upward' }} onPress={noop} />
  </BottomSheet>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };

/** Twenty rows: the sheet stops at 88% of the screen, the rows scroll and Close stays in view. */
export const LongContent = {
  render: () => (
    <BottomSheet testID="sheet" label="Many options" onClose={noop}>
      {Array.from({ length: 20 }, (_v, i) => <MenuRow key={i} text={`Option ${i + 1}`} icon={{ sf: 'circle', md: 'circle' }} onPress={noop} />)}
    </BottomSheet>
  ),
  globals: EASY,
};
