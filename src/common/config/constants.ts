import * as msg from './message.json';

export const MSG = msg;

export enum EGender {
  MALE,
  FEMALE,
  UNKNOWN,
}

export enum EAudience {
  PUBLIC,
  FOLLOWERS,
  ONLY_ME,
}
