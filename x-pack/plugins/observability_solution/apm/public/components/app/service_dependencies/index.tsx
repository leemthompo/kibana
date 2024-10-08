/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiSpacer } from '@elastic/eui';
import { EuiTitle } from '@elastic/eui';
import { EuiPanel } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';
import { isLogsOnlySignal } from '../../../utils/get_signal_type';
import { ChartPointerEventContextProvider } from '../../../context/chart_pointer_event/chart_pointer_event_context';
import { ServiceOverviewDependenciesTable } from '../service_overview/service_overview_dependencies_table';
import { ServiceDependenciesBreakdownChart } from './service_dependencies_breakdown_chart';
import { useApmServiceContext } from '../../../context/apm_service/use_apm_service_context';
import { ServiceTabEmptyState } from '../service_tab_empty_state';

export function ServiceDependencies() {
  const { serviceEntitySummary } = useApmServiceContext();

  const hasLogsOnlySignal =
    serviceEntitySummary?.dataStreamTypes && isLogsOnlySignal(serviceEntitySummary.dataStreamTypes);

  if (hasLogsOnlySignal) {
    return <ServiceTabEmptyState id="serviceDependencies" />;
  }

  return (
    <>
      <ChartPointerEventContextProvider>
        <EuiPanel hasBorder={true}>
          <EuiTitle size="xs">
            <h2>
              {i18n.translate('xpack.apm.serviceDependencies.breakdownChartTitle', {
                defaultMessage: 'Time spent by dependency',
              })}
            </h2>
          </EuiTitle>
          <ServiceDependenciesBreakdownChart height={200} />
        </EuiPanel>
      </ChartPointerEventContextProvider>
      <EuiSpacer size="l" />
      <ServiceOverviewDependenciesTable />
    </>
  );
}
