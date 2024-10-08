/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import _ from 'lodash';
import { updateOldState } from './vis_update_state';

// eslint-disable-next-line camelcase
import { pre_6_1, since_6_1 } from './vis_update_state.stub';

function watchForChanges(obj) {
  const originalObject = _.cloneDeep(obj);
  return () => {
    return _.isEqual(originalObject, obj);
  };
}

describe('updateOldState', () => {
  it('needs to be a function', () => {
    expect(typeof updateOldState).toBe('function');
  });

  describe('gauge conversion', () => {
    const oldGaugeChart = {
      type: 'gauge',
      fontSize: 12,
    };

    it('needs to convert fontSize for old gauge charts', () => {
      const isUnchanged = watchForChanges(oldGaugeChart);
      const state = updateOldState(oldGaugeChart);
      expect(state).toEqual({
        type: 'gauge',
        gauge: {
          style: {
            fontSize: 12,
          },
        },
      });
      // The method is not allowed to modify the passed in object
      expect(isUnchanged()).toBe(true);
    });

    it('needs to convert gauge metrics (pre 6.1) to real metrics', () => {
      const isUnchanged = watchForChanges(pre_6_1);
      const state = updateOldState(pre_6_1);

      expect(state).toEqual(since_6_1);
      // The method is not allowed to modify the passed in object
      expect(isUnchanged()).toBe(true);
    });

    it('it needs to convert gauges created as metrics (pre 6.1) to real gauges', () => {
      const oldState = {
        type: 'metric',
        params: {
          type: 'gauge',
          gauge: {
            gaugeType: 'Arc',
          },
        },
      };
      const state = updateOldState(oldState);
      expect(state.type).toBe('gauge');
      expect(state.params.type).toBe('gauge');
      expect(state.params.gauge.gaugeType).toBe('Arc');
    });
  });

  describe('terms agg conversion', () => {
    it('should update _term to _key', () => {
      const oldState = {
        aggs: [{ type: 'terms', params: { orderBy: '_term' } }],
      };
      const state = updateOldState(oldState);
      expect(state.aggs[0].params.orderBy).toBe('_key');
    });
  });

  describe('property name conversion', () => {
    it('should update showMeticsAtAllLevels to showMetricsAtAllLevels', () => {
      const oldState = {
        params: {
          showMeticsAtAllLevels: false,
        },
      };
      const state = updateOldState(oldState);
      expect(state.params.showMetricsAtAllLevels).toBe(false);
      expect(state.params.showMeticsAtAllLevels).toBe(undefined);
    });
  });

  describe('TSVB ids conversion', () => {
    it('should update the seriesId from number to string with x prefix', () => {
      const oldState = {
        type: 'metrics',
        params: {
          series: [
            {
              id: '10',
            },
            {
              id: 'ABC',
            },
            {
              id: 1,
            },
          ],
        },
      };
      const state = updateOldState(oldState);
      expect(state.params.series).toEqual([
        {
          id: 'x10',
        },
        {
          id: 'ABC',
        },
        {
          id: 'x1',
        },
      ]);
    });
    it('should update the metrics ids from number to string with x prefix', () => {
      const oldState = {
        type: 'metrics',
        params: {
          series: [
            {
              id: '10',
              metrics: [
                {
                  id: '1000',
                },
                {
                  id: '74a66e70-ac44-11eb-9865-6b616e971cf8',
                },
              ],
            },
            {
              id: 'ABC',
              metrics: [
                {
                  id: null,
                },
              ],
            },
          ],
        },
      };
      const state = updateOldState(oldState);
      expect(state.params.series).toEqual([
        {
          id: 'x10',
          metrics: [
            {
              id: 'x1000',
            },
            {
              id: '74a66e70-ac44-11eb-9865-6b616e971cf8',
            },
          ],
        },
        {
          id: 'ABC',
          metrics: [
            {
              id: 'xnull',
            },
          ],
        },
      ]);
    });
  });
});
