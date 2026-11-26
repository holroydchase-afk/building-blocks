// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-native-web-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  core: { disableTelemetry: true },
};
export default config;
