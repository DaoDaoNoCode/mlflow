import { describe, it, expect, jest } from '@jest/globals';
import { shouldEnableAIGateway } from '@mlflow/mlflow/src/common/utils/FeatureUtils';
import { isEvaluatingTracesInDetailsViewEnabled } from './FeatureUtils';

jest.mock('@mlflow/mlflow/src/common/utils/FeatureUtils', () => ({
  shouldEnableAIGateway: jest.fn(),
}));

describe('isEvaluatingTracesInDetailsViewEnabled', () => {
  it('is enabled when the AI Gateway is enabled', () => {
    jest.mocked(shouldEnableAIGateway).mockReturnValue(true);
    expect(isEvaluatingTracesInDetailsViewEnabled()).toBe(true);
  });

  it('is disabled when the AI Gateway is disabled', () => {
    jest.mocked(shouldEnableAIGateway).mockReturnValue(false);
    expect(isEvaluatingTracesInDetailsViewEnabled()).toBe(false);
  });
});
