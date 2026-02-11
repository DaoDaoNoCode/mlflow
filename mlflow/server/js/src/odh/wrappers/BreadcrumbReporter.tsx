/**
 * BreadcrumbReporter
 *
 * Watches the current route inside MLflow's BrowserRouter and reports
 * structured breadcrumb segments to the host via a callback prop.
 * Must be rendered inside <BrowserRouter> to access useLocation/matchPath.
 *
 * Paths in the segments are relative to the MLflow basename
 * (e.g. "/experiments/3/runs"). The host prepends its own base route
 * and workspace query param when rendering the breadcrumb links.
 */
import { useEffect, useRef } from 'react';
import { useLocation, matchPath } from '../../common/utils/RoutingUtils';
import { useSelector } from 'react-redux';
import { useQueryClient } from '../../common/utils/reactQueryHooks';

export interface BreadcrumbSegment {
  /** Display label for the breadcrumb item. */
  label: string;
  /** Path relative to the MLflow basename, e.g. "/experiments/3/runs". */
  path: string;
}

interface BreadcrumbReporterProps {
  onBreadcrumbChange?: (segments: BreadcrumbSegment[]) => void;
}

const EXPERIMENTS_CRUMB: BreadcrumbSegment = { label: 'Experiments', path: '/experiments' };

/**
 * Try to resolve an experiment name from the Redux store.
 * The experiment is put into Redux by useExperimentReduxStoreCompat
 * after the GraphQL fetch in ExperimentPageTabs.
 */
const useExperimentName = (experimentId: string | undefined): string | undefined => {
  return useSelector((state: any) => {
    if (!experimentId) return undefined;
    const experiment = state?.entities?.experimentsById?.[experimentId];
    return experiment?.name ?? undefined;
  });
};

/**
 * Try to resolve a run name from the Redux store.
 */
const useRunName = (runUuid: string | undefined): string | undefined => {
  return useSelector((state: any) => {
    if (!runUuid) return undefined;
    const runInfo = state?.entities?.runInfosByUuid?.[runUuid];
    return runInfo?.runName ?? undefined;
  });
};

/**
 * Try to resolve a logged model name from the React Query cache.
 * The model is fetched by useGetLoggedModelQuery on the detail page.
 */
const useLoggedModelName = (loggedModelId: string | undefined): string | undefined => {
  const queryClient = useQueryClient();
  if (!loggedModelId) return undefined;
  const data = queryClient.getQueryData<{ model: { info?: { name?: string } } }>(['GET_LOGGED_MODEL', loggedModelId]);
  return data?.model?.info?.name ?? undefined;
};

/**
 * Build breadcrumb segments from the current pathname.
 *
 * Structure:
 *   Experiment list          -> [] (empty)
 *   Experiment page (any tab)-> [Experiments (link), experiment-name (active)]
 *   Run page (any tab)       -> [Experiments (link), experiment-name (link), run-name (active)]
 *   Logged model detail      -> [Experiments (link), experiment-name (link), model-id (active)]
 *   Compare / metric / etc.  -> [Experiments (link), page-label (active)]
 *   Prompts list             -> [] (empty)
 *   Prompt detail            -> [Prompts (link), prompt-name (active)]
 */
function buildSegments(
  pathname: string,
  experimentName: string | undefined,
  runName: string | undefined,
  loggedModelName: string | undefined,
): BreadcrumbSegment[] {
  // Experiment list / index — no breadcrumbs
  if (pathname === '/' || pathname === '/experiments' || pathname === '') {
    return [];
  }

  // Run page: /experiments/:id/runs/:runUuid(/*) — 3 levels
  const runMatch = matchPath('/experiments/:experimentId/runs/:runUuid/*', pathname);
  if (runMatch) {
    const { experimentId, runUuid } = runMatch.params as { experimentId: string; runUuid: string };
    const expLabel = experimentName || `Experiment ${experimentId}`;
    const rLabel = runName || runUuid;
    return [
      EXPERIMENTS_CRUMB,
      { label: expLabel, path: `/experiments/${experimentId}` },
      { label: rLabel, path: `/experiments/${experimentId}/runs/${runUuid}` },
    ];
  }

  // Logged model detail: /experiments/:id/models/:modelId(/:tabName) — 3 levels
  const modelMatch =
    matchPath('/experiments/:experimentId/models/:loggedModelId/:tabName', pathname) ||
    matchPath('/experiments/:experimentId/models/:loggedModelId', pathname);
  if (modelMatch) {
    const { experimentId, loggedModelId } = modelMatch.params as {
      experimentId: string;
      loggedModelId: string;
    };
    const expLabel = experimentName || `Experiment ${experimentId}`;
    const mLabel = loggedModelName || loggedModelId;
    return [
      EXPERIMENTS_CRUMB,
      { label: expLabel, path: `/experiments/${experimentId}` },
      { label: mLabel, path: `/experiments/${experimentId}/models/${loggedModelId}` },
    ];
  }

  // Experiment page (any tab / sub-tab) — 2 levels, tab does NOT appear in breadcrumb
  const expMatch =
    matchPath('/experiments/:experimentId/*', pathname) || matchPath('/experiments/:experimentId', pathname);
  if (expMatch) {
    const { experimentId } = expMatch.params as { experimentId: string };
    const expLabel = experimentName || `Experiment ${experimentId}`;
    return [EXPERIMENTS_CRUMB, { label: expLabel, path: `/experiments/${experimentId}` }];
  }

  // Direct run page (no experiment context): /runs/:runUuid
  const directRunMatch = matchPath('/runs/:runUuid', pathname);
  if (directRunMatch) {
    const { runUuid } = directRunMatch.params as { runUuid: string };
    const rLabel = runName || runUuid;
    return [EXPERIMENTS_CRUMB, { label: rLabel, path: `/runs/${runUuid}` }];
  }

  // Compare runs / experiments
  if (matchPath('/compare-runs', pathname)) {
    return [EXPERIMENTS_CRUMB, { label: 'Compare Runs', path: '/compare-runs' }];
  }
  if (matchPath('/compare-experiments/:searchString', pathname)) {
    return [EXPERIMENTS_CRUMB, { label: 'Compare Experiments', path: pathname }];
  }

  // Metric
  if (matchPath('/metric/*', pathname)) {
    return [EXPERIMENTS_CRUMB, { label: 'Metric', path: pathname }];
  }

  // Top-level prompts
  if (matchPath('/prompts/:promptName', pathname)) {
    const match = matchPath('/prompts/:promptName', pathname)!;
    const { promptName } = match.params as { promptName: string };
    return [
      { label: 'Prompts', path: '/prompts' },
      { label: promptName, path: `/prompts/${promptName}` },
    ];
  }

  return [];
}

/**
 * Renders nothing. Watches route changes and calls onBreadcrumbChange
 * with structured breadcrumb segments.
 */
export const BreadcrumbReporter: React.FC<BreadcrumbReporterProps> = ({ onBreadcrumbChange }) => {
  const { pathname } = useLocation();

  // Extract IDs from the pathname for entity name lookups
  const expMatch = matchPath('/experiments/:experimentId/*', pathname);
  const runMatch = matchPath('/experiments/:experimentId/runs/:runUuid/*', pathname);
  const directRunMatch = matchPath('/runs/:runUuid', pathname);
  const modelDetailMatch =
    matchPath('/experiments/:experimentId/models/:loggedModelId/:tabName', pathname) ||
    matchPath('/experiments/:experimentId/models/:loggedModelId', pathname);

  const experimentId = expMatch?.params?.experimentId;
  const runUuid = runMatch?.params?.runUuid || directRunMatch?.params?.runUuid;
  const loggedModelId = modelDetailMatch?.params?.loggedModelId;

  const experimentName = useExperimentName(experimentId);
  const runName = useRunName(runUuid);
  const loggedModelName = useLoggedModelName(loggedModelId);

  const prevJsonRef = useRef<string>('');

  // Wait for entity names to resolve before reporting breadcrumbs.
  // This avoids a flicker where IDs briefly show before display names load.
  const isWaitingForNames = Boolean(experimentId && !experimentName) || Boolean(loggedModelId && !loggedModelName);

  useEffect(() => {
    if (!onBreadcrumbChange) return;
    if (isWaitingForNames) return;

    const segments = buildSegments(pathname, experimentName, runName, loggedModelName);
    const json = JSON.stringify(segments);

    // Only call back when segments actually change
    if (json !== prevJsonRef.current) {
      prevJsonRef.current = json;
      onBreadcrumbChange(segments);
    }
  }, [pathname, experimentName, runName, loggedModelName, onBreadcrumbChange, isWaitingForNames]);

  return null;
};
