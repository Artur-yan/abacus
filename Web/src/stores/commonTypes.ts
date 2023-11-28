export enum FetchStateEnum {
  NOT_STARTED = 'NOT-STARTED',
  IN_PROGRESS = 'IN-PROGRESS',
  COMPLETED = 'COMPLETED',
}
export type FetchState = `${FetchStateEnum}`;
