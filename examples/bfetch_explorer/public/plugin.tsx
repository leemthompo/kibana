/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Plugin, CoreSetup } from '@kbn/core/public';
import { BfetchPublicSetup, BfetchPublicStart } from '@kbn/bfetch-plugin/public';
import { DeveloperExamplesSetup } from '@kbn/developer-examples-plugin/public';
import { mount } from './mount';

export interface ExplorerService {
  double: (number: { num: number }) => Promise<{ num: number }>;
}

export interface BfetchExplorerSetupPlugins {
  bfetch: BfetchPublicSetup;
  developerExamples: DeveloperExamplesSetup;
}

export interface BfetchExplorerStartPlugins {
  bfetch: BfetchPublicStart;
}

export class BfetchExplorerPlugin implements Plugin {
  public setup(
    core: CoreSetup<BfetchExplorerStartPlugins, void>,
    { bfetch, developerExamples }: BfetchExplorerSetupPlugins
  ) {
    const double = bfetch.batchedFunction<{ num: number }, { num: number }>({
      url: '/bfetch_explorer/double',
    });

    const explorer: ExplorerService = {
      double,
    };

    core.application.register({
      id: 'bfetch-explorer',
      title: 'bfetch explorer',
      visibleIn: [],
      mount: mount(core, explorer),
    });

    developerExamples.register({
      appId: 'bfetch-explorer',
      title: 'bfetch',
      description:
        'bfetch is a service that allows to batch HTTP requests and streams responses back.',
      links: [
        {
          label: 'README',
          href: 'https://github.com/elastic/kibana/blob/main/src/plugins/bfetch/README.md',
          iconType: 'logoGithub',
          size: 's',
          target: '_blank',
        },
      ],
    });
  }

  public start() {}
  public stop() {}
}
