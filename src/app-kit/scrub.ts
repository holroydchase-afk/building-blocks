// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Strip anything private from text before it is kept or sent: urls, keys and tokens, emails, phone numbers, quoted text,
// file paths and names, coordinates and picture metadata, plus any words the app names. Use it on every error message.

/** A US-looking phone number anywhere in a piece of text. */
const PHONE_IN_TEXT = /(\+?1[\s().-]{0,2})?\(?\d{3}\)?[\s.-]{0,2}\d{3}[\s.-]?\d{4}/g;

/** Every phone number in the text becomes "[phone]". */
export const scrubPhone = (s: string): string => s.replace(PHONE_IN_TEXT, '[phone]');
export const hasPhone = (s: string): boolean => new RegExp(PHONE_IN_TEXT.source).test(s);

const MAX_MESSAGE = 120;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A short message with nothing private left in it. `scrub` lists words the app knows are private (a caption, a name):
 *  each becomes "[caption]". Order matters: whole urls before paths. */
export function safeMessage(raw: string, scrub: (string | null | undefined)[] = []): string {
  let m = raw;
  for (const s of scrub) if (s && s.trim()) m = m.replace(new RegExp(escape(s.trim()), 'gi'), '[caption]');
  // Picture metadata: everything from the first metadata word on is dropped.
  m = m.replace(/\b(GPS\w*|Latitude|Longitude|Make|Model|Lens\w*|Serial\w*|DateTime\w*|Software|MakerNote|XMP|ICC|Exif\w*\s*[:=])[\s\S]*$/i, '[photo info removed]');
  m = m.replace(/"[^"]*"|“[^”]*”|'[^']{2,}'/g, '[text]'); // quoted text is usually a caption or name
  m = m.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S*/gi, '[url]');
  m = m.replace(/\b(?:file|content|ph|assets-library|data|blob):\S*/gi, '[url]');
  m = m.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]');
  m = scrubPhone(m);
  m = m.replace(/\b(key|dek|token|secret|signature|sig|password|apikey|auth\w*|credential)\b\s*[:=]\s*\S+/gi, '$1=[hidden]');
  m = m.replace(/\beyJ[\w-]*\.[\w-]*\.?[\w-]*/g, '[token]');
  m = m.replace(/(?:~|\.{1,2})?\/[^\s]+/g, '[path]');
  m = m.replace(/\b[\w-]+\.(?:jpe?g|heic|heif|png|gif|webp|mov|mp4|m4v|dng)\b/gi, '[file]');
  m = m.replace(/[A-Za-z0-9+/_=-]{20,}/g, '[hidden]');
  m = m.replace(/-?\d{1,3}\.\d{3,}/g, '[number]'); // coordinates
  m = m.replace(/\s+/g, ' ').trim();
  return m.length > MAX_MESSAGE ? `${m.slice(0, MAX_MESSAGE - 1)}…` : m;
}
