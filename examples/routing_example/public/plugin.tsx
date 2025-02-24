/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { CoreStart, Plugin, CoreSetup, AppMountParameters } from '@kbn/core/public';
import { DeveloperExamplesSetup } from '@kbn/developer-examples-plugin/public';
import { getServices } from './services';

interface SetupDeps {
  developerExamples: DeveloperExamplesSetup;
}

export class RoutingExamplePlugin implements Plugin<{}, {}, SetupDeps, {}> {
  public setup(core: CoreSetup, { developerExamples }: SetupDeps) {
    core.application.register({
      id: 'routingExample',
      title: 'Routing',
      visibleIn: [],
      async mount(params: AppMountParameters) {
        const [coreStart] = await core.getStartServices();
        const startServices = getServices(coreStart);
        const { renderApp } = await import('./app');
        return renderApp(startServices, params.element);
      },
    });

    developerExamples.register({
      appId: 'routingExample',
      title: 'Routing',
      description: `Examples show how to use core routing and fetch services to register and query your own custom routes.`,
      links: [
        {
          label: 'IRouter',
          href: 'https://github.com/elastic/kibana/blob/8.3/docs/development/core/server/kibana-plugin-core-server.irouter.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
        {
          label: 'HttpHandler (core.http.fetch)',
          href: 'https://github.com/elastic/kibana/blob/8.3/docs/development/core/public/kibana-plugin-core-public.httphandler.md',
          iconType: 'logoGithub',
          target: '_blank',
          size: 's',
        },
      ],
    });
    return {};
  }

  public start(core: CoreStart) {
    return {};
  }

  public stop() {}
}
