// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { initialOf } from '../format';

describe('UI-27 avatar initial', () => {
  it.each([
    ['The Smiths', 'S'],
    ['the smiths', 'S'],
    ['Sam', 'S'],
    ['Theo', 'T'],
    ['  ann Jo', 'AJ'],
    ['The', 'T'],
    ['', '?'],
  ])('UI-27 %p → %p', (name, want) => {
    expect(initialOf(name)).toBe(want);
  });
});

// the first letters of the first two words, after skipping a leading "The"; one word stays one letter.
describe('first and second initials', () => {
  it.each([
    ['Jo Ann', 'JA'],
    ['Jo Bee', 'JB'],
    ['Nana Ruth', 'NR'],
    ['Sam', 'S'],
    ['The Smiths', 'S'],
    ['The Smith Team', 'ST'],
    ['  ann   jo  ', 'AJ'],
    ['Mary Ann Lee', 'MA'],
    ['', '?'],
    ['   ', '?'],
  ])('%p → %p', (name, want) => {
    expect(initialOf(name)).toBe(want);
  });

  it('Jo Ann and Jo Bee no longer share an initial', () => {
    expect(initialOf('Jo Ann')).not.toBe(initialOf('Jo Bee'));
  });
});

describe('plural and list helpers', () => {
  it('count words: one is singular, anything else plural, with a no-break space', () => {
    const { count } = require('../format') as { count: (n: number, one: string, many?: string) => string };
    expect(count(1, 'person', 'people')).toBe('1 person');
    expect(count(0, 'person', 'people')).toBe('0 people');
    expect(count(3, 'item')).toBe('3\u00a0items');
  });
  it('andList joins names with commas and "and", dropping blanks and repeats', () => {
    const { andList } = require('../format') as { andList: (n: string[]) => string };
    expect(andList([])).toBe('');
    expect(andList(['A'])).toBe('A');
    expect(andList(['A', 'B'])).toBe('A and B');
    expect(andList(['A', '', 'B', 'A', 'C'])).toBe('A, B and C');
  });
});
