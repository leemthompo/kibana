/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { InternalUiSettingsRouter } from '../internal_types';
import { registerDeleteRoute } from './delete';
import { registerGetRoute } from './get';
import { registerSetManyRoute } from './set_many';
import { registerSetRoute } from './set';

export function registerRoutes(router: InternalUiSettingsRouter) {
  registerGetRoute(router);
  registerDeleteRoute(router);
  registerSetRoute(router);
  registerSetManyRoute(router);
}

export { registerInternalRoutes } from './internal';
