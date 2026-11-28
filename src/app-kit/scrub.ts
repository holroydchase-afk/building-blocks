// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Strip anything private from text before it is kept or sent: urls, keys and tokens, emails, phone numbers, quoted text,
// file paths and names, coordinates and picture metadata, plus any words the app names. Use it on every error message.

/** A phone number anywhere in a piece of text: US style, international (+44 …) or a bare 7-digit one (555-1234). */
const PHONE_IN_TEXT = /\+\d{1,3}[\s.-]?\d{2,5}(?:[\s.-]?\d{2,6}){1,3}|(\+?1[\s().-]{0,2})?\(?\d{3}\)?[\s.-]{0,2}\d{3}[\s.-]?\d{4}|\b\d{3}[-. ]\d{4}\b/g;

/** Every phone number in the text becomes "[phone]". */
export const scrubPhone = (s: string): string => s.replace(PHONE_IN_TEXT, '[phone]');
export const hasPhone = (s: string): boolean => new RegExp(PHONE_IN_TEXT.source).test(s);

const MAX_MESSAGE = 120;
/** Longer text is cut before any pattern runs, so a huge message (a server's whole error page) cannot stall the app. */
const MAX_INPUT = 1000;
/** Lowercase, one space between words: so a private word still matches after a line break or a changed case. */
const fold = (s: string) => s.replace(/\s+/g, ' ').trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A short message with nothing private left in it. `scrub` lists words the app knows are private (a caption, a name):
 *  each becomes "[caption]". Order matters: whole urls before paths. */
export function safeMessage(raw: string, scrub: (string | null | undefined)[] = []): string {
  let m = fold(String(raw).slice(0, MAX_INPUT * 4)).slice(0, MAX_INPUT);
  for (const s of scrub) if (s && s.trim()) m = m.replace(new RegExp(escape(fold(s)), 'gi'), '[caption]');
  // Picture metadata: everything from the first metadata word on is dropped.
  m = m.replace(/\b(GPS\w*|Latitude|Longitude|Lens\w*|Serial\w*|DateTime\w*|MakerNote|XMP|ICC|Exif\w*)\b[\s\S]*$/i, '[photo info removed]');
  m = m.replace(/\b(Make|Model|Software)\s*[:=][\s\S]*$/i, '[photo info removed]');
  m = m.replace(/"[^"]*"|“[^”]*”|‘[^’]*’|'[^']{2,}'/g, '[text]'); // quoted text is usually a caption or name
  m = m.replace(/["“][^"”]*$/, '[text]'); // a quote that never closes (a cut-off message)
  m = m.replace(/\bBearer\s+\S+/gi, 'Bearer [hidden]');
  m = m.replace(/\b(password|passcode|secret|token|key)\s+(?:is|was)\s+\S+/gi, '$1 [hidden]');
  m = m.replace(/\b[a-z][a-z0-9+.-]*:\/\/\S*/gi, '[url]');
  m = m.replace(/\b(?:file|content|ph|assets-library|data|blob):\S*/gi, '[url]');
  m = m.replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\/\S*/gi, '[url]'); // a host with a path
  m = m.replace(/[\p{L}\p{N}._+-]+@[\p{L}\p{N}.-]+/gu, '[email]');
  m = m.replace(/\b[A-Za-z]:\\\S*|\\\\\S+/g, '[path]'); // a drive path and a network share
  m = m.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[ip]');
  m = m.replace(/\b[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){2,7}\b/gi, '[ip]');
  m = scrubPhone(m);
  m = m.replace(/\b(key|dek|token|secret|signature|sig|password|apikey|auth\w*|credential)\b\s*[:=]\s*\S+/gi, '$1=[hidden]');
  m = m.replace(/\beyJ[\w-]*\.[\w-]*\.?[\w-]*/g, '[token]');
  m = m.replace(/\/(?:Users|home)\/(?:[^/\n]+\/)*[^/\s]*/g, '[path]'); // a home folder: its names can hold spaces
  m = m.replace(/(?:~|\.{1,2})?\/[^\s]+/g, '[path]');
  m = m.replace(/\b[\w-]+\.(?:jpe?g|heic|heif|png|gif|webp|mov|mp4|m4v|dng)\b/gi, '[file]');
  m = m.replace(/[A-Za-z0-9+/_=-]{20,}/g, '[hidden]');
  m = m.replace(/-?\d{1,3}\.\d{3,}/g, '[number]'); // coordinates
  m = m.replace(/\s+/g, ' ').trim();
  return m.length > MAX_MESSAGE ? `${m.slice(0, MAX_MESSAGE - 1)}…` : m;
}
