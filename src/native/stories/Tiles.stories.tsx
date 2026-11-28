// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AddCard, AddTile, AvatarTile, DateStamp } from '..';
import { DARK, EASY, LIGHT, noop } from './helpers';

export default { title: 'Native/Tiles', component: AvatarTile };

const render = () => (
  <View>
    <View style={styles.row}>
      <AvatarTile name="Everyone" count={8} avatars={['Sam Smith', 'Jo Lee', 'Ann Ray']} picked across={3} onPress={noop} />
      <AvatarTile name="The Smiths" count={3} avatars={['Sam Smith', 'Jo Lee']} picked={false} across={3} onPress={noop} />
      <AvatarTile name="A very long group name" count={1} avatars={['Ann Ray']} picked={false} across={3} onPress={noop} />
    </View>
    <AddTile label="Add items" onPress={noop} />
    <AddCard label="Add items" title="Add items" icon={{ sf: 'plus', md: 'add' }} onPress={noop} inSpot={<DateStamp date={new Date(2026, 10, 3)} />}>{null}</AddCard>
  </View>
);

export const Light = { render, globals: LIGHT };
export const Dark = { render, globals: DARK };
export const EasyView = { render, globals: EASY };

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap' } });
