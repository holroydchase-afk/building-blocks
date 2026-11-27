// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { BackButton } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/BackButton', component: BackButton };

const render = () => <BackButton to="Settings" onPress={noop} />;

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
