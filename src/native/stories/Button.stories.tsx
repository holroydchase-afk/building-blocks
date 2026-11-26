// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { Card, Button } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/Button', component: Button };

const render = () => (
  <Card>
    <Button label="Save changes" text="Save" onPress={noop} />
    <Button label="Edit details" text="Edit" variant="tinted" icon={{ sf: 'plus', md: 'add' }} onPress={noop} />
    <Button label="Cancel" variant="secondary" onPress={noop} />
    <Button label="Delete item" text="Delete" variant="danger" onPress={noop} />
    <Button label="Learn more" variant="quiet" role="link" onPress={noop} />
    <Button label="Not ready yet" disabled onPress={noop} />
    <Button label="Saving" busy onPress={noop} />
  </Card>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };
