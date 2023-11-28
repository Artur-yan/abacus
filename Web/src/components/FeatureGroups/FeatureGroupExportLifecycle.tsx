export enum FeatureGroupExportLifecycle {
  PENDING = 'PENDING',
  EXPORTING = 'EXPORTING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export const FeatureGroupExportLifecycleDesc = {
  [FeatureGroupExportLifecycle.PENDING]: 'Pending',
  [FeatureGroupExportLifecycle.EXPORTING]: 'Exporting',
  [FeatureGroupExportLifecycle.COMPLETE]: 'Complete',
  [FeatureGroupExportLifecycle.FAILED]: 'Failed',
};
