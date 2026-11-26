// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { GroupedSection, MenuRow } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/MenuRow', component: MenuRow };

const render = () => (
  <GroupedSection>
    <MenuRow text="Messages" count="2 new" icon={{ sf: 'bubble.left', md: 'chat' }} onPress={noop} />
    <MenuRow text="Language" value="English" icon={{ sf: 'globe', md: 'language' }} onPress={noop} />
    <MenuRow text="Help" icon={{ sf: 'questionmark', md: 'help' }} onPress={noop} />
  </GroupedSection>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
