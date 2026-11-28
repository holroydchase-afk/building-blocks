// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The one public entry of the /app-kit layer: import from '@holroyd/building-blocks/app-kit', never a deep path.
export { ErrorBoundary, type SafeError } from './ErrorBoundary';
export { andList, count, initialOf, longDay, LONG_MONTHS, relativeTime, shortDate, SHORT_MONTHS } from './format';
export { createNavContext } from './nav';
export { buildErrorReport, describeOs, type ErrorReport } from './errorReport';
export { classifyError, loadFailedWords, loadFailure, type LoadFailure } from './errors';
export { createProblemLog, type ProblemEntry, type ProblemLogOptions } from './problemLog';
export { hasPhone, safeMessage, scrubPhone } from './scrub';
export { createLastSeen, type LastSeen } from './lastSeen';
export { createPrefs, pickBoolean, pickOneOf, type Prefs, type PrefsOptions } from './prefs';
export { chainClears, chooseRuntime } from './runtime';
