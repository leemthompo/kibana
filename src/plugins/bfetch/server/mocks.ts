/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { coreMock } from '@kbn/core/server/mocks';
import { BfetchServerSetup, BfetchServerStart } from '.';
import { plugin as pluginInitializer } from '.';

export type Setup = jest.Mocked<BfetchServerSetup>;
export type Start = jest.Mocked<BfetchServerStart>;

const createSetupContract = (): Setup => {
  const setupContract: Setup = {
    addBatchProcessingRoute: jest.fn(),
    addStreamingResponseRoute: jest.fn(),
  };
  return setupContract;
};

const createStartContract = (): Start => {
  const startContract: Start = {};

  return startContract;
};

const createPlugin = async () => {
  const pluginInitializerContext = coreMock.createPluginInitializerContext();
  const coreSetup = coreMock.createSetup();
  const coreStart = coreMock.createStart();
  const plugin = await pluginInitializer(pluginInitializerContext);
  const setup = await plugin.setup(coreSetup, {});

  return {
    pluginInitializerContext,
    coreSetup,
    coreStart,
    plugin,
    setup,
    doStart: async () => await plugin.start(coreStart, {}),
  };
};

export const bfetchPluginMock = {
  createSetupContract,
  createStartContract,
  createPlugin,
};
