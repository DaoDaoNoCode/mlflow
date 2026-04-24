import { MLFLOW_PUBLISHED_VERSION } from '../../common/mlflow-published-version';
import { isIntegrated } from '../../common/utils/embedUtils';
import type {
  BaseTrackingEventProperties,
  FormTrackingEventProperties,
  IdentifyEventProperties,
  LinkTrackingEventProperties,
  MiscTrackingEventProperties,
} from './trackingProperties';

type WindowWithSegment = Window & {
  analytics?: {
    track: (event: string, properties?: object, context?: object) => void;
    page: (category?: string, properties?: object, context?: object) => void;
    identify: (userId?: string, traits?: object) => void;
  };
  clusterID?: string;
};

const win = window as WindowWithSegment;

const fireTrackingEvent = (eventName: string, properties: BaseTrackingEventProperties): void => {
  const clusterID = win.clusterID ?? '';
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.log(
      `Telemetry event triggered: ${eventName} - ${JSON.stringify(properties)} for version ${MLFLOW_PUBLISHED_VERSION}`,
    );
  } else if (isIntegrated() && win.analytics) {
    win.analytics.track(eventName, { ...properties, clusterID }, { app: { version: MLFLOW_PUBLISHED_VERSION } });
  }
};

export const fireFormTrackingEvent = (eventName: string, properties: FormTrackingEventProperties): void => {
  fireTrackingEvent(eventName, properties);
};

export const fireLinkTrackingEvent = (eventName: string, properties: LinkTrackingEventProperties): void => {
  fireTrackingEvent(eventName, properties);
};

export const fireSimpleTrackingEvent = (eventName: string): void => {
  fireTrackingEvent(eventName, {});
};

export const fireMiscTrackingEvent = (eventName: string, properties: MiscTrackingEventProperties): void => {
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.warn('This tracking event type is a last resort for legacy purposes');
  }
  fireTrackingEvent(eventName, properties);
};

export const firePageEvent = (): void => {
  const clusterID = win.clusterID ?? '';
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.log(`Page event triggered for version ${MLFLOW_PUBLISHED_VERSION}: ${window.location.pathname}`);
  } else if (isIntegrated() && win.analytics) {
    win.analytics.page(undefined, { clusterID }, { app: { version: MLFLOW_PUBLISHED_VERSION } });
  }
};

export const fireIdentifyEvent = (properties: IdentifyEventProperties): void => {
  const clusterID = win.clusterID ?? '';
  if (process.env['NODE_ENV'] === 'development') {
    // eslint-disable-next-line no-console
    console.log(`Identify event triggered: ${JSON.stringify(properties)}`);
  } else if (isIntegrated() && win.analytics) {
    win.analytics.identify(properties.userID, {
      clusterID,
      isAdmin: properties.isAdmin,
      canCreateProjects: properties.canCreateProjects,
    });
  }
};
