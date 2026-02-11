import { useModularArchContext, DeploymentMode } from 'mod-arch-core';

/**
 * Hook for functional components. Reads deployment mode from
 * ModularArchContextProvider (set in app.tsx for standalone,
 * MlflowExperimentWrapper for federated).
 *
 * Returns false (standalone) when called outside a provider, which
 * happens in tests that don't wrap components in ModularArchContextProvider.
 */
export const useIsIntegrated = (): boolean => {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { config } = useModularArchContext();
    return config.deploymentMode !== DeploymentMode.Standalone;
  } catch {
    return false;
  }
};

/**
 * Function for class components that can't use hooks (MetricView,
 * CompareRunView). Uses DEPLOYMENT_MODE env var set by the federated
 * webpack config. Prefer useIsIntegrated() in functional components.
 */
export const isIntegrated = (): boolean => process.env['DEPLOYMENT_MODE'] === 'federated';
