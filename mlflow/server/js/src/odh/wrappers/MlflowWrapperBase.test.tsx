import { jest, describe, test, expect, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { onlineManager, useQuery } from '@mlflow/mlflow/src/common/utils/reactQueryHooks';
import MlflowWrapperBase from './MlflowWrapperBase';
import { useBodyPopupContainer } from '../utils/portalContainer';

jest.mock('./federatedGlobalStyles', () => ({}));

// The real provider lists namespaces from the dashboard BFF on mount.
jest.mock('mod-arch-core', () => ({
  ...jest.requireActual<typeof import('mod-arch-core')>('mod-arch-core'),
  ModularArchContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../i18n/I18nUtils', () => ({
  useI18nInit: () =>
    jest.requireActual<typeof import('react-intl')>('react-intl').createIntl({ locale: 'en', messages: {} }),
}));

jest.mock('../../experiment-tracking/hooks/useServerInfo', () => ({
  ...jest.requireActual<typeof import('../../experiment-tracking/hooks/useServerInfo')>(
    '../../experiment-tracking/hooks/useServerInfo',
  ),
  ServerInfoProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const QueryProbe = () => {
  const { data } = useQuery({ queryKey: ['federated-offline-probe'], queryFn: async () => 'query resolved' });
  return <span>{data ?? 'query pending'}</span>;
};

const PORTAL_CONTAINER_SELECTOR = 'body > [data-mlflow-federated-portal-container="true"]';

const PopupContainerProbe = ({ onResolve }: { onResolve: (getContainer: () => HTMLElement) => void }) => {
  onResolve(useBodyPopupContainer());
  return <span>popup container probe</span>;
};

describe('MlflowWrapperBase', () => {
  afterEach(() => {
    onlineManager.setOnline(undefined);
  });

  test('runs queries while the browser reports being offline', async () => {
    onlineManager.setOnline(false);

    render(
      <MlflowWrapperBase memoryRouterEntries={['/']}>
        <QueryProbe />
      </MlflowWrapperBase>,
    );

    expect(await screen.findByText('query resolved')).toBeInTheDocument();
  });

  test('provides its own body-level portal container to useBodyPopupContainer', async () => {
    let getContainer: (() => HTMLElement) | undefined;

    const { unmount } = render(
      <MlflowWrapperBase memoryRouterEntries={['/']}>
        <PopupContainerProbe onResolve={(fn) => (getContainer = fn)} />
      </MlflowWrapperBase>,
    );
    await screen.findByText('popup container probe');

    const portalContainers = document.querySelectorAll(PORTAL_CONTAINER_SELECTOR);
    expect(portalContainers).toHaveLength(1);
    expect(getContainer?.()).toBe(portalContainers[0]);

    unmount();
    expect(document.querySelectorAll(PORTAL_CONTAINER_SELECTOR)).toHaveLength(0);
  });

  test('gives each concurrently mounted wrapper its own portal container', async () => {
    let getFirstContainer: (() => HTMLElement) | undefined;
    let getSecondContainer: (() => HTMLElement) | undefined;

    const first = render(
      <MlflowWrapperBase memoryRouterEntries={['/']}>
        <PopupContainerProbe onResolve={(fn) => (getFirstContainer = fn)} />
      </MlflowWrapperBase>,
    );
    const second = render(
      <MlflowWrapperBase memoryRouterEntries={['/']}>
        <PopupContainerProbe onResolve={(fn) => (getSecondContainer = fn)} />
      </MlflowWrapperBase>,
    );
    expect(await screen.findAllByText('popup container probe')).toHaveLength(2);

    const [firstContainer, secondContainer] = Array.from(document.querySelectorAll(PORTAL_CONTAINER_SELECTOR));
    expect(getFirstContainer?.()).toBe(firstContainer);
    expect(getSecondContainer?.()).toBe(secondContainer);
    expect(firstContainer).not.toBe(secondContainer);

    first.unmount();
    expect(firstContainer.isConnected).toBe(false);
    expect(getSecondContainer?.()).toBe(secondContainer);
    expect(secondContainer.isConnected).toBe(true);

    second.unmount();
  });
});
