// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Loading } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/Loading', component: Loading };

const render = () => <Loading words="Loading your list" />;

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
