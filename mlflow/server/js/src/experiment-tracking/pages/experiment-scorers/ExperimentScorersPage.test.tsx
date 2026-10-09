import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from '@databricks/i18n';
import { DesignSystemProvider } from '@databricks/design-system';
import ExperimentScorersPage from './ExperimentScorersPage';
import { useFeatureEnabled } from '../../hooks/useServerInfo';
import { enableScorersUI } from '../../../common/utils/FeatureUtils';

jest.mock('./ExperimentScorersContentContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="scorers-content" />,
}));
jest.mock('./useEvaluateTraces', () => ({
  usePrefetchTraces: jest.fn(),
}));
jest.mock('../../../common/utils/RoutingUtils', () => ({
  useParams: () => ({ experimentId: 'exp-1' }),
}));
jest.mock('../../hooks/useServerInfo', () => ({
  SERVER_FEATURE_KEYS: { GATEWAY: 'gateway' },
  useFeatureEnabled: jest.fn(),
}));
jest.mock('../../../common/utils/FeatureUtils', () => ({
  isExperimentEvalResultsMonitoringUIEnabled: () => false,
  enableScorersUI: jest.fn(),
}));

const renderPage = () =>
  render(
    <IntlProvider locale="en">
      <DesignSystemProvider>
        <ExperimentScorersPage />
      </DesignSystemProvider>
    </IntlProvider>,
  );

describe('ExperimentScorersPage gateway gating', () => {
  beforeEach(() => {
    jest.mocked(useFeatureEnabled).mockReturnValue(true);
    jest.mocked(enableScorersUI).mockReturnValue(true);
  });

  it('shows the judges UI when the server and the build enable the gateway', () => {
    renderPage();
    expect(screen.getByTestId('scorers-content')).toBeInTheDocument();
  });

  it('shows the empty state when the build disables the gateway, even if the server flag defaults to on', () => {
    jest.mocked(enableScorersUI).mockReturnValue(false);
    renderPage();
    expect(screen.queryByTestId('scorers-content')).not.toBeInTheDocument();
    expect(screen.getByText('Create and manage judges')).toBeInTheDocument();
  });

  it('shows the empty state when the server disables the gateway', () => {
    jest.mocked(useFeatureEnabled).mockReturnValue(false);
    renderPage();
    expect(screen.queryByTestId('scorers-content')).not.toBeInTheDocument();
    expect(screen.getByText('Create and manage judges')).toBeInTheDocument();
  });
});
