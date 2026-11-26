// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { GroupedSection, Txt } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/GroupedSection', component: GroupedSection };

const render = () => (
  <GroupedSection>
    <Txt variant="headline">Settings-style group</Txt>
    <Txt tone="muted">Sits on a surface color, with rounded corners.</Txt>
  </GroupedSection>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
