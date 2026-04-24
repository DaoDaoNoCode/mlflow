export type IdentifyEventProperties = {
  isAdmin: boolean;
  userID?: string;
  canCreateProjects: boolean;
};

export const enum TrackingOutcome {
  submit = 'submit',
  cancel = 'cancel',
}

export type BaseFormTrackingEventProperties = {
  outcome: TrackingOutcome;
  success?: boolean;
  error?: string;
};

export type FormTrackingEventProperties = {
  [key: string]: string | number | boolean | undefined;
} & BaseFormTrackingEventProperties;

export type LinkTrackingEventProperties = {
  from?: string;
  href?: string;
  to?: string;
  type?: string;
  section?: string;
  name?: string;
};

export type MiscTrackingEventProperties = {
  [key: string]: string | number | boolean | undefined;
};
