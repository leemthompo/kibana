/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { usePerformanceContext } from '@kbn/ebt-tools';
import React, { useCallback, useMemo } from 'react';
import { useCurrentEuiBreakpoint } from '@elastic/eui';
import styled from '@emotion/styled';
import type { InventoryItemType } from '@kbn/metrics-data-access-plugin/common';
import type {
  InfraWaffleMapBounds,
  InfraWaffleMapOptions,
  InfraFormatter,
} from '../../../../common/inventory/types';
import { NoData } from '../../../../components/empty_states';
import { InfraLoadingPanel } from '../../../../components/loading';
import { Map } from './waffle/map';
import { TableView } from './table_view';
import type { SnapshotNode } from '../../../../../common/http_api/snapshot_api';
import { calculateBoundsFromNodes } from '../lib/calculate_bounds_from_nodes';
import { Legend } from './waffle/legend';
import { useAssetDetailsFlyoutState } from '../hooks/use_asset_details_flyout_url_state';
import { AssetDetailsFlyout } from './waffle/asset_details_flyout';

export interface KueryFilterQuery {
  kind: 'kuery';
  expression: string;
}

interface Props {
  options: InfraWaffleMapOptions;
  nodeType: InventoryItemType;
  nodes: SnapshotNode[];
  loading: boolean;
  reload: () => void;
  onDrilldown: (filter: KueryFilterQuery) => void;
  currentTime: number;
  view: string;
  boundsOverride: InfraWaffleMapBounds;
  autoBounds: boolean;
  formatter: InfraFormatter;
  bottomMargin: number;
  showLoading: boolean;
  isAutoReloading?: boolean;
  refreshInterval?: number;
}

export const NodesOverview = ({
  autoBounds,
  boundsOverride,
  loading,
  nodes,
  nodeType,
  reload,
  view,
  currentTime,
  options,
  formatter,
  onDrilldown,
  bottomMargin,
  showLoading,
  refreshInterval,
  isAutoReloading,
}: Props) => {
  const currentBreakpoint = useCurrentEuiBreakpoint();
  const [{ detailsItemId, entityType }, setFlyoutUrlState] = useAssetDetailsFlyoutState();
  const { onPageReady } = usePerformanceContext();

  const nodeName = useMemo(
    () => nodes.find((node) => node.path[0].value === detailsItemId)?.name,
    [detailsItemId, nodes]
  );

  const closeFlyout = useCallback(
    () =>
      setFlyoutUrlState({
        detailsItemId: null,
        entityType: null,
      }),
    [setFlyoutUrlState]
  );

  const handleDrilldown = useCallback(
    (filter: string) => {
      onDrilldown({
        kind: 'kuery',
        expression: filter,
      });
      return;
    },
    [onDrilldown]
  );

  const noData = !loading && nodes && nodes.length === 0;
  if (loading && showLoading) {
    // Don't show loading screen when we're auto-reloading
    return (
      <InfraLoadingPanel
        height="100%"
        width="100%"
        text={i18n.translate('xpack.infra.waffle.loadingDataText', {
          defaultMessage: 'Loading data',
        })}
      />
    );
  } else if (noData) {
    return (
      <NoData
        titleText={i18n.translate('xpack.infra.waffle.noDataTitle', {
          defaultMessage: 'There is no data to display.',
        })}
        bodyText={i18n.translate('xpack.infra.waffle.noDataDescription', {
          defaultMessage: 'Try adjusting your time or filter.',
        })}
        refetchText={i18n.translate('xpack.infra.waffle.checkNewDataButtonLabel', {
          defaultMessage: 'Check for new data',
        })}
        onRefetch={() => {
          reload();
        }}
        testString="noMetricsDataPrompt"
      />
    );
  }
  const dataBounds = calculateBoundsFromNodes(nodes);
  const bounds = autoBounds ? dataBounds : boundsOverride;
  const isStatic = ['xs', 's'].includes(currentBreakpoint!);

  if (!loading) {
    onPageReady();
  }

  if (view === 'table') {
    return (
      <TableContainer>
        <TableView
          nodeType={nodeType}
          nodes={nodes}
          options={options}
          formatter={formatter}
          currentTime={currentTime}
          onFilter={handleDrilldown}
        />
        {nodeType === entityType && detailsItemId && (
          <AssetDetailsFlyout
            entityId={detailsItemId}
            entityName={nodeName}
            entityType={nodeType}
            closeFlyout={closeFlyout}
            currentTime={currentTime}
            isAutoReloading={isAutoReloading}
            options={options}
            refreshInterval={refreshInterval}
          />
        )}
      </TableContainer>
    );
  }
  return (
    <MapContainer positionStatic={isStatic}>
      <Map
        nodeType={nodeType}
        nodes={nodes}
        detailsItemId={detailsItemId}
        options={options}
        formatter={formatter}
        currentTime={currentTime}
        onFilter={handleDrilldown}
        bounds={bounds}
        bottomMargin={bottomMargin}
        staticHeight={isStatic}
      />
      {nodeType === entityType && detailsItemId && (
        <AssetDetailsFlyout
          entityId={detailsItemId}
          entityName={nodeName}
          entityType={nodeType}
          closeFlyout={closeFlyout}
          currentTime={currentTime}
          isAutoReloading={isAutoReloading}
          options={options}
          refreshInterval={refreshInterval}
        />
      )}
      <Legend
        formatter={formatter}
        bounds={bounds}
        dataBounds={dataBounds}
        legend={options.legend}
      />
    </MapContainer>
  );
};

const TableContainer = styled.div`
  padding: ${(props) => props.theme.euiTheme.size.l};
`;

const MapContainer = styled.div<{ positionStatic: boolean }>`
  position: ${(props) => (props.positionStatic ? 'static' : 'absolute')};
  display: flex;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;
