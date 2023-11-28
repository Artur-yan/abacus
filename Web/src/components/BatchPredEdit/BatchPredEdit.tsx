import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import batchPred from '../../stores/reducers/batchPred';
import { memProjectById } from '../../stores/reducers/projects';
import DatasetForUseCase from '../DatasetForUseCase/DatasetForUseCase';
const s = require('./BatchPredEdit.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchPredEditProps {}

const BatchPredEdit = React.memo((props: PropsWithChildren<IBatchPredEditProps>) => {
  const { paramsProp, authUser, projects, batchPredParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projects: state.projects,
    batchPredParam: state.batchPred,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const batchPredId = paramsProp?.get('batchPredId');

  const isDataset = paramsProp?.get('isDataset') === 'true';

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projects, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projects, projectId]);

  useEffect(() => {
    batchPred.memBatchDescribe(undefined, batchPredId, true);
  }, [batchPredParam, batchPredId]);
  const batchPredOne = useMemo(() => {
    return batchPred.memBatchDescribe(undefined, batchPredId, false);
  }, [batchPredParam, batchPredId]);

  return (
    <div>
      <DatasetForUseCase
        featureGroupsCount={undefined}
        lastModelId={undefined}
        anyPnpLocationUsed={undefined}
        anyModel={undefined}
        isBatchPred={true}
        isBatchPredDataset={isDataset}
        useCase={foundProject1?.useCase}
        projectId={projectId}
        useCaseTag={true}
      />
    </div>
  );
});

export default BatchPredEdit;
