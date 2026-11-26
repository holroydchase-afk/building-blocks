// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React, { useState } from 'react';
import { Choice, GroupedSection } from '..';
import { DARK, EASY, LIGHT } from './helpers';

export default { title: 'Native/Choice', component: Choice };

function Demo() {
  const [on, setOn] = useState(true);
  const [box, setBox] = useState(false);
  const [pick, setPick] = useState('a');
  return (
    <GroupedSection>
      <Choice kind="switch" label="Bigger text" title="Bigger text" detail="Makes every word larger." checked={on} onPress={() => setOn(!on)} />
      <Choice kind="checkbox" label="Remind me" title="Remind me" checked={box} onPress={() => setBox(!box)} />
      <Choice kind="radio" label="Option A" title="Option A" checked={pick === 'a'} onPress={() => setPick('a')} />
      <Choice kind="radio" label="Option B" title="Option B" checked={pick === 'b'} onPress={() => setPick('b')} />
    </GroupedSection>
  );
}
const render = () => <Demo />;

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
