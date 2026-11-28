// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AddCard, AddTile, AvatarTile, DateStamp, ThemeProvider } from '..';
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

/** High contrast on a non-default theme and dark mode: where the edge and initial contrast fixes matter. */
export const HighContrast = {
  render: () => <ThemeProvider theme="beet" highContrast>{render()}</ThemeProvider>,
  globals: LIGHT,
};
export const HighContrastDark = {
  render: () => <ThemeProvider theme="pomegranate" dark highContrast>{render()}</ThemeProvider>,
  globals: DARK,
};
/** Four across with long names and a long "Invite" word, in Easy view: the tiles wrap and never cut a name. */
export const LargeText = {
  render: () => (
    <View>
      <View style={styles.row}>
        {['Neighbours and cousins', 'Extraordinarily-long-teamname', 'Sam', 'Everyone'].map((n) => (
          <AvatarTile key={n} name={n} count={12} avatars={['Sam Smith', 'Jo Lee', 'Ann Ray']} picked={n === 'Sam'} across={4} onPress={noop} />
        ))}
      </View>
      <AddTile label="Invite people" text="Invite" onPress={noop} />
    </View>
  ),
  globals: EASY,
};

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap' } });
