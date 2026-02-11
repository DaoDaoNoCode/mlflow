/**
 * ODH Dashboard extension declarations for MLflow.
 *
 * Area and navigation extensions are declared here (remote side) so that
 * they only appear in the dashboard when the MLflow remote loads successfully.
 * If the remote fails to load, these extensions are absent and the nav hides.
 *
 * The route extension stays on the HOST side (packages/mlflow/extensions.ts
 * in odh-dashboard) because it needs host internals (ApplicationsPage,
 * PipelineCoreProjectSelector, etc.) for page chrome.
 *
 * String values must match the SupportedArea enum in odh-dashboard:
 *   SupportedArea.MLFLOW = 'mlflow-application'
 *   SupportedArea.DS_PIPELINES = 'ds-pipelines'
 */
const extensions: Record<string, unknown>[] = [
  {
    type: 'app.area',
    properties: {
      id: 'mlflow-application',
      featureFlags: ['mlflow'],
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: ['ds-pipelines', 'mlflow-application'],
    },
    properties: {
      id: 'experiments-mlflow',
      title: 'Experiments (MLflow)',
      href: '/develop-train/mlflow/experiments',
      section: 'develop-and-train',
      path: '/develop-train/mlflow/experiments/*',
      label: 'Tech Preview',
    },
  },
];
export default extensions;
