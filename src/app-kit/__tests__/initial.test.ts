// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { initialOf } from '../format';

describe('UI-27 avatar initial', () => {
  it.each([
    ['The Millers', 'M'],
    ['the smiths', 'S'],
    ['Sam', 'S'],
    ['Theo', 'T'],
    ['  grandma Jo', 'GJ'],
    ['The', 'T'],
    ['', '?'],
  ])('UI-27 %p → %p', (name, want) => {
    expect(initialOf(name)).toBe(want);
  });
});

// the first letters of the first two words, after skipping a leading "The"; one word stays one letter.
describe('FIRSTMIN-1 first and second initials', () => {
  it.each([
    ['Grandma Jo', 'GJ'],
    ['Grandpa Earl', 'GE'],
    ['Nana Ruth', 'NR'],
    ['Sam', 'S'],
    ['The Millers', 'M'],
    ['The Smith Family', 'SF'],
    ['  grandma   jo  ', 'GJ'],
    ['Mary Ann Lee', 'MA'],
    ['', '?'],
    ['   ', '?'],
  ])('FIRSTMIN-1 %p → %p', (name, want) => {
    expect(initialOf(name)).toBe(want);
  });

  it('FIRSTMIN-1 Grandma Jo and Grandpa Earl no longer share an initial', () => {
    expect(initialOf('Grandma Jo')).not.toBe(initialOf('Grandpa Earl'));
  });
});

describe('plural and list helpers', () => {
  it('count words: one is singular, anything else plural, with a no-break space', () => {
    const { count } = require('../format') as { count: (n: number, one: string, many?: string) => string };
    expect(count(1, 'person', 'people')).toBe('1 person');
    expect(count(0, 'person', 'people')).toBe('0 people');
    expect(count(3, 'photo')).toBe('3 photos');
  });
  it('andList joins names with commas and "and", dropping blanks and repeats', () => {
    const { andList } = require('../format') as { andList: (n: string[]) => string };
    expect(andList([])).toBe('');
    expect(andList(['A'])).toBe('A');
    expect(andList(['A', 'B'])).toBe('A and B');
    expect(andList(['A', '', 'B', 'A', 'C'])).toBe('A, B and C');
  });
});
