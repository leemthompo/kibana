/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@kbn/i18n';
import type { DocLinks } from '@kbn/doc-links';
import type { ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';

import type { EuiFlyoutSize } from '@elastic/eui/src/components/flyout/flyout';
import type { IHttpFetchError } from '@kbn/core-http-browser';
import { useIsMounted } from '@kbn/securitysolution-hook-utils';
import { useLocation } from 'react-router-dom';
import { GLOBAL_ARTIFACT_TAG } from '../../../../../common/endpoint/service/artifacts';
import { useIsExperimentalFeatureEnabled } from '../../../../common/hooks/use_experimental_features';
import { useMarkInsightAsRemediated } from '../hooks/use_mark_workflow_insight_as_remediated';
import type { WorkflowInsightRouteState } from '../../../pages/endpoint_hosts/types';
import { useUrlParams } from '../../../hooks/use_url_params';
import { useIsFlyoutOpened } from '../hooks/use_is_flyout_opened';
import { useTestIdGenerator } from '../../../hooks/use_test_id_generator';
import { useSetUrlParams } from '../hooks/use_set_url_params';
import type {
  ArtifactFormComponentOnChangeCallbackProps,
  ArtifactFormComponentProps,
  ArtifactListPageUrlParams,
} from '../types';
import { ManagementPageLoader } from '../../management_page_loader';
import type { ExceptionsListApiClient } from '../../../services/exceptions_list/exceptions_list_api_client';
import { useKibana, useToasts } from '../../../../common/lib/kibana';
import { createExceptionListItemForCreate } from '../../../../../common/endpoint/service/artifacts/utils';
import { useWithArtifactSubmitData } from '../hooks/use_with_artifact_submit_data';
import { useIsArtifactAllowedPerPolicyUsage } from '../hooks/use_is_artifact_allowed_per_policy_usage';
import { useGetArtifact } from '../../../hooks/artifacts';
import { ArtifactConfirmModal } from './artifact_confirm_modal';
import { useUserPrivileges } from '../../../../common/components/user_privileges';

export const ARTIFACT_FLYOUT_LABELS = Object.freeze({
  flyoutEditTitle: i18n.translate('xpack.securitySolution.artifactListPage.flyoutEditTitle', {
    defaultMessage: 'Add artifact',
  }),

  flyoutCreateTitle: i18n.translate('xpack.securitySolution.artifactListPage.flyoutCreateTitle', {
    defaultMessage: 'Create artifact',
  }),
  flyoutCancelButtonLabel: i18n.translate(
    'xpack.securitySolution.artifactListPage.flyoutCancelButtonLabel',
    {
      defaultMessage: 'Cancel',
    }
  ),
  flyoutCreateSubmitButtonLabel: i18n.translate(
    'xpack.securitySolution.artifactListPage.flyoutCreateSubmitButtonLabel',
    { defaultMessage: 'Add' }
  ),
  flyoutEditSubmitButtonLabel: i18n.translate(
    'xpack.securitySolution.artifactListPage.flyoutEditSubmitButtonLabel',
    { defaultMessage: 'Save' }
  ),
  flyoutDowngradedLicenseTitle: i18n.translate(
    'xpack.securitySolution.artifactListPage.expiredLicenseTitle',
    {
      defaultMessage: 'Expired License',
    }
  ),
  flyoutDowngradedLicenseInfo: i18n.translate(
    'xpack.securitySolution.artifactListPage.flyoutDowngradedLicenseInfo',
    {
      defaultMessage:
        'Your Kibana license has been downgraded. Future policy configurations will now be globally assigned to all policies.',
    }
  ),
  /**
   * This should be set to a sentence that includes a link to the documentation page for this specific artifact type.
   *
   * @example
   * // in a component
   * () => {
   *   const { docLinks } = useKibana().services;
   *   return (
   *     <FormattedMessage
   *        id="some-id-1"
   *        defaultMessage="For more information, see our {link}."
   *        value={{
   *          link: <EuiLink target="_blank" href={`${docLinks.links.securitySolution.eventFilters}`}>
   *            <FormattedMessage id="dome-id-2" defaultMessage="Event filters documentation" />
   *          </EuiLink>
   *        }}
   *     />
   *   );
   * }
   */
  flyoutDowngradedLicenseDocsInfo: (_: DocLinks['securitySolution']): React.ReactNode =>
    i18n.translate('xpack.securitySolution.artifactListPage.flyoutDowngradedLicenseDocsInfo', {
      defaultMessage: 'For more information, see our documentation.',
    }),

  flyoutEditItemLoadFailure: (errorMessage: string): string =>
    i18n.translate('xpack.securitySolution.artifactListPage.flyoutEditItemLoadFailure', {
      defaultMessage: 'Failed to retrieve item for edit. Reason: {errorMessage}',
      values: { errorMessage },
    }),

  /**
   * A function returning the label for the success message toast
   * @param itemName
   * @example
   *  ({ name }) => i18n.translate('xpack.securitySolution.some_page.flyoutCreateSubmitSuccess', {
   *    defaultMessage: '"{name}" has been added.',
   *    values: { name },
   *  })
   */
  flyoutCreateSubmitSuccess: ({ name }: ExceptionListItemSchema): string =>
    i18n.translate('xpack.securitySolution.some_page.flyoutCreateSubmitSuccess', {
      defaultMessage: '"{name}" has been added.',
      values: { name },
    }),

  /**
   * Returns the edit success message for the toast
   * @param item
   * @example
   *  ({ name }) =>
   *    i18n.translate('xpack.securitySolution.some_page.flyoutEditSubmitSuccess', {
   *    defaultMessage: '"{name}" has been updated.',
   *    values: { name },
   *  })
   */
  flyoutEditSubmitSuccess: ({ name }: ExceptionListItemSchema): string =>
    i18n.translate('xpack.securitySolution.artifactListPage.flyoutEditSubmitSuccess', {
      defaultMessage: '"{name}" has been updated.',
      values: { name },
    }),
});

const createFormInitialState = (
  listId: string,
  item: ArtifactFormComponentOnChangeCallbackProps['item'] | undefined
): ArtifactFormComponentOnChangeCallbackProps => {
  return {
    isValid: false,
    item: item ?? createExceptionListItemForCreate(listId),
  };
};

export interface ArtifactFlyoutProps {
  apiClient: ExceptionsListApiClient;
  FormComponent: React.ComponentType<ArtifactFormComponentProps>;
  onSuccess(): void;
  onClose(): void;
  submitHandler?: (
    item: ArtifactFormComponentOnChangeCallbackProps['item'],
    mode: ArtifactFormComponentProps['mode']
  ) => Promise<ExceptionListItemSchema>;
  /**
   * If the artifact data is provided and it matches the id in the URL, then it will not be
   * retrieved again via the API
   */
  item?: ExceptionListItemSchema;
  /** Any label overrides */
  labels?: Partial<typeof ARTIFACT_FLYOUT_LABELS>;
  'data-test-subj'?: string;
  size?: EuiFlyoutSize;
}

/**
 * Show the flyout based on URL params
 */
export const ArtifactFlyout = memo<ArtifactFlyoutProps>(
  ({
    apiClient,
    item,
    FormComponent,
    onSuccess,
    onClose,
    submitHandler,
    labels: _labels = {},
    'data-test-subj': dataTestSubj,
    size = 'm',
  }) => {
    const {
      docLinks: {
        links: { securitySolution },
      },
    } = useKibana().services;

    const location = useLocation<WorkflowInsightRouteState>();
    const [sourceInsight, setSourceInsight] = useState<{ id: string; back_url: string } | null>(
      null
    );
    const getTestId = useTestIdGenerator(dataTestSubj);
    const toasts = useToasts();
    const isFlyoutOpened = useIsFlyoutOpened();
    const setUrlParams = useSetUrlParams();
    const { urlParams } = useUrlParams<ArtifactListPageUrlParams>();
    const isMounted = useIsMounted();
    const isSpaceAwarenessEnabled = useIsExperimentalFeatureEnabled(
      'endpointManagementSpaceAwarenessEnabled'
    );
    const canManageGlobalArtifacts =
      useUserPrivileges().endpointPrivileges.canManageGlobalArtifacts;
    const labels = useMemo<typeof ARTIFACT_FLYOUT_LABELS>(() => {
      return {
        ...ARTIFACT_FLYOUT_LABELS,
        ..._labels,
      };
    }, [_labels]);
    // TODO:PT Refactor internal/external state into the `useWithArtifactSubmitData()` hook
    const [externalIsSubmittingData, setExternalIsSubmittingData] = useState<boolean>(false);
    const [externalSubmitHandlerError, setExternalSubmitHandlerError] = useState<
      IHttpFetchError | undefined
    >(undefined);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

    const isEditFlow = urlParams.show === 'edit';
    const formMode: ArtifactFormComponentProps['mode'] = isEditFlow ? 'edit' : 'create';

    const {
      isLoading: internalIsSubmittingData,
      mutateAsync: submitData,
      error: internalSubmitError,
    } = useWithArtifactSubmitData(apiClient, formMode);

    const { mutateAsync: markInsightAsRemediated } = useMarkInsightAsRemediated(
      sourceInsight?.back_url
    );

    const isSubmittingData = useMemo(() => {
      return submitHandler ? externalIsSubmittingData : internalIsSubmittingData;
    }, [externalIsSubmittingData, internalIsSubmittingData, submitHandler]);

    const submitError = useMemo(() => {
      return submitHandler ? externalSubmitHandlerError : internalSubmitError;
    }, [externalSubmitHandlerError, internalSubmitError, submitHandler]);

    const {
      isRefetching: isLoadingItemForEdit,
      error,
      refetch: fetchItemForEdit,
    } = useGetArtifact(apiClient, urlParams.itemId ?? '', undefined, {
      // We don't want to run this at soon as the component is rendered. `refetch` is called
      // a little later if determined we're in `edit` mode
      enabled: false,
    });

    const [formState, setFormState] = useState<ArtifactFormComponentOnChangeCallbackProps>(() => {
      const initialFormState = createFormInitialState(apiClient.listId, item);

      // for Create Mode: If user is not able to manage global artifacts then the initial item should be per-policy
      if (!item && isSpaceAwarenessEnabled && !canManageGlobalArtifacts) {
        initialFormState.item.tags = (initialFormState.item.tags ?? []).filter(
          (tag) => tag !== GLOBAL_ARTIFACT_TAG
        );
      }

      return initialFormState;
    });
    const showExpiredLicenseBanner = useIsArtifactAllowedPerPolicyUsage(
      { tags: formState.item.tags ?? [] },
      formMode
    );

    const hasItemDataForEdit = useMemo<boolean>(() => {
      // `item_id` will not be defined for a `create` flow, so we use it below to determine if we
      // are still attempting to load the item for edit from the api
      return !!item || !!formState.item.item_id;
    }, [formState.item.item_id, item]);

    const isInitializing = useMemo(() => {
      return isEditFlow && !hasItemDataForEdit;
    }, [hasItemDataForEdit, isEditFlow]);

    const handleFlyoutClose = useCallback(() => {
      if (isSubmittingData) {
        return;
      }

      // `undefined` will cause params to be dropped from url
      setUrlParams({ ...urlParams, itemId: undefined, show: undefined }, true);

      onClose();
    }, [isSubmittingData, onClose, setUrlParams, urlParams]);

    const handleFormComponentOnChange: ArtifactFormComponentProps['onChange'] = useCallback(
      ({ item: updatedItem, isValid, confirmModalLabels }) => {
        if (isMounted()) {
          setFormState({
            item: updatedItem,
            isValid,
            confirmModalLabels,
          });
        }
      },
      [isMounted]
    );

    const handleSuccess = useCallback(
      async (result: ExceptionListItemSchema) => {
        toasts.addSuccess(
          isEditFlow
            ? labels.flyoutEditSubmitSuccess(result)
            : labels.flyoutCreateSubmitSuccess(result)
        );

        // Check if this artifact creation was opened from an endpoint insight
        try {
          if (sourceInsight?.id) {
            await markInsightAsRemediated({ insightId: sourceInsight.id });
            return;
          }
        } catch {
          setSourceInsight(null);
        }

        if (isMounted()) {
          // Close the flyout
          // `undefined` will cause params to be dropped from url
          setUrlParams({ ...urlParams, itemId: undefined, show: undefined }, true);

          onSuccess();
        }
      },
      [
        isEditFlow,
        isMounted,
        labels,
        markInsightAsRemediated,
        onSuccess,
        setUrlParams,
        sourceInsight,
        toasts,
        urlParams,
      ]
    );

    const handleSubmitClick = useCallback(() => {
      if (submitHandler) {
        setExternalIsSubmittingData(true);

        submitHandler(formState.item, formMode)
          .then(handleSuccess)
          .catch((submitHandlerError) => {
            if (isMounted()) {
              setExternalSubmitHandlerError(submitHandlerError);
            }
          })
          .finally(() => {
            if (isMounted()) {
              setExternalIsSubmittingData(false);
            }
          });
      } else if (formState.confirmModalLabels) {
        setShowConfirmModal(true);
      } else {
        submitData(formState.item).then(handleSuccess);
      }
    }, [
      formMode,
      formState.item,
      formState.confirmModalLabels,
      handleSuccess,
      isMounted,
      submitData,
      submitHandler,
    ]);

    const confirmModalOnSuccess = useCallback(
      () => submitData(formState.item).then(handleSuccess),
      [submitData, formState.item, handleSuccess]
    );

    const confirmModal = useMemo(() => {
      if (formState.confirmModalLabels) {
        const { title, body, confirmButton, cancelButton } = formState.confirmModalLabels;
        return (
          <ArtifactConfirmModal
            title={title}
            body={body}
            confirmButton={confirmButton}
            cancelButton={cancelButton}
            onSuccess={confirmModalOnSuccess}
            onCancel={() => setShowConfirmModal(false)}
            data-test-subj="artifactConfirmModal"
          />
        );
      }
    }, [formState, confirmModalOnSuccess]);

    // If this form was opened from an endpoint insight, prepopulate the form with the insight data
    useEffect(() => {
      if (location.state?.insight?.id && location.state?.insight?.item) {
        setSourceInsight({
          id: location.state.insight.id,
          back_url: location.state.insight.back_url,
        });
        setFormState({ isValid: true, item: location.state.insight.item });

        location.state.insight = undefined;
      }
    }, [apiClient.listId, location.state, location.state?.insight]);

    // If we don't have the actual Artifact data yet for edit (in initialization phase - ex. came in with an
    // ID in the url that was not in the list), then retrieve it now
    useEffect(() => {
      if (isEditFlow && !hasItemDataForEdit && !error && isInitializing && !isLoadingItemForEdit) {
        fetchItemForEdit().then(({ data: editItemData }) => {
          if (editItemData && isMounted()) {
            setFormState(createFormInitialState(apiClient.listId, editItemData));
          }
        });
      }
    }, [
      apiClient.listId,
      error,
      fetchItemForEdit,
      isEditFlow,
      isInitializing,
      isLoadingItemForEdit,
      hasItemDataForEdit,
      isMounted,
    ]);

    // If we got an error while trying to retrieve the item for edit, then show a toast message
    useEffect(() => {
      if (isEditFlow && error) {
        toasts.addWarning(labels.flyoutEditItemLoadFailure(error?.body?.message || error.message));

        // Blank out the url params for id and show (will close out the flyout)
        setUrlParams({ itemId: undefined, show: undefined });
      }
    }, [error, isEditFlow, labels, setUrlParams, toasts, urlParams.itemId]);

    const artifactFlyoutTitleId = useGeneratedHtmlId({
      prefix: 'artifactFlyoutTitle',
    });

    if (!isFlyoutOpened || error) {
      return null;
    }

    return (
      <EuiFlyout
        size={size}
        onClose={handleFlyoutClose}
        data-test-subj={dataTestSubj}
        aria-labelledby={artifactFlyoutTitleId}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2 id={artifactFlyoutTitleId}>
              {isEditFlow ? labels.flyoutEditTitle : labels.flyoutCreateTitle}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        {!isInitializing && showExpiredLicenseBanner && (
          <EuiCallOut
            title={labels.flyoutDowngradedLicenseTitle}
            color="warning"
            iconType="question"
            data-test-subj={getTestId('expiredLicenseCallout')}
          >
            {labels.flyoutDowngradedLicenseInfo}{' '}
            {labels.flyoutDowngradedLicenseDocsInfo(securitySolution)}
          </EuiCallOut>
        )}
        <EuiFlyoutBody>
          {isInitializing && <ManagementPageLoader data-test-subj={getTestId('loader')} />}

          {!isInitializing && (
            <FormComponent
              onChange={handleFormComponentOnChange}
              disabled={isSubmittingData}
              item={formState.item}
              error={submitError ?? undefined}
              mode={formMode}
            />
          )}
        </EuiFlyoutBody>
        {!isInitializing && (
          <EuiFlyoutFooter>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  data-test-subj={getTestId('cancelButton')}
                  onClick={handleFlyoutClose}
                  disabled={isSubmittingData}
                >
                  {labels.flyoutCancelButtonLabel}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  data-test-subj={getTestId('submitButton')}
                  fill
                  disabled={!formState.isValid || isSubmittingData}
                  onClick={handleSubmitClick}
                  isLoading={isSubmittingData}
                >
                  {isEditFlow
                    ? labels.flyoutEditSubmitButtonLabel
                    : labels.flyoutCreateSubmitButtonLabel}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
        )}
        {showConfirmModal && confirmModal}
      </EuiFlyout>
    );
  }
);
ArtifactFlyout.displayName = 'ArtifactFlyout';
