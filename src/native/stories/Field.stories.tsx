// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React, { useState } from 'react';
import { Card, Field } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/Field', component: Field };

function Demo() {
  const [name, setName] = useState('');
  return (
    <Card>
      <Field label="Your name" value={name} onChangeText={setName} placeholder="Sam" />
      <Field label="Email address" value="sam@" onChangeText={setName} error="Enter a full email address." />
      <Field label="Add a note (optional)" underline value={name} onChangeText={setName} />
    </Card>
  );
}
const render = () => <Demo />;

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
