import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, RefObject, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import StoreActions from '../../stores/actions/StoreActions';
import { calcFileDataUseByDatasetIdProjectId } from '../../stores/reducers/defDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import EditorElem from '../EditorElem/EditorElem';
const s = require('./EditorElemForDataset.module.css');
const sd = require('../antdUseDark.module.css');

interface IEditorElemForDatasetProps {
  datasetId?: string;
  projectId?: string;
  refEditor?: RefObject<any>;
  onChange?: (name?, value?) => void;
  height?: number;
  showSmallHelp?: any;
  sample?: any;
  value?: any;
  hideExpandFull?: any;
  backTrasnparent?: boolean;
  useSameSpace?: boolean;
  hideErrors?: boolean;
}

const EditorElemForDataset = React.memo((props: PropsWithChildren<IEditorElemForDatasetProps>) => {
  const { paramsProp, featureGroupsParam, defDatasets, projectsParam, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    defDatasets: state.defDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = props.projectId;
  const datasetId = props.datasetId;

  useEffect(() => {
    memProjectById(props.projectId, true);
  }, [projectsParam, props.projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(props.projectId, false);
  }, [projectsParam, props.projectId]);

  const memDatasetSchema = (doCall, defDatasets, projectId, datasetId) => {
    if (defDatasets && projectId && datasetId) {
      let dsSchema1 = calcFileDataUseByDatasetIdProjectId(undefined, datasetId, projectId);
      if (dsSchema1 == null) {
        if (defDatasets.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileDataUse_(projectId, datasetId);
          }
        }
      } else {
        return dsSchema1;
      }
    }
  };

  useEffect(() => {
    if (projectId && datasetId) {
      memDatasetSchema(true, defDatasets, projectId, datasetId);
    }
  }, [projectId, datasetId, defDatasets]);

  const columns = useMemo(() => {
    if (!projectId || !datasetId) {
      return null;
    }

    let dataset1 = memDatasetSchema(false, defDatasets, projectId, datasetId);
    if (dataset1) {
      return dataset1.get('schema')?.toJS();
    }
  }, [defDatasets, projectId, datasetId]);

  const memProjectUseCase = (foundProject1) => {
    if (!foundProject1) {
      return;
    }
    return foundProject1.useCase;
  };

  const useCase1 = useMemo(() => {
    return memProjectUseCase(foundProject1);
  }, [foundProject1]);

  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase1);
  }, [useCasesParam, useCase1]);
  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase1);
  }, [useCasesParam, useCase1]);

  const { listObjects, listProperties, dictObjects } = useMemo(() => {
    let listObjects = [],
      listProperties = [],
      dictObjects = {};

    // if(Object.keys(dictObjects ?? {}).length===1) {
    //   listProperties = dictObjects[Object.keys(dictObjects ?? {})[0]] ?? [];
    //   dictObjects = {};
    // listObjects = [];
    // }
    columns?.some((c1) => {
      let n1 = c1?.name;
      if (!Utils.isNullOrEmpty(n1)) {
        listProperties.push(n1);
      }
    });

    return { listObjects, listProperties, dictObjects };
  }, [columns]);

  const { value, onChange } = props ?? ({} as any);

  return (
    <EditorElem
      hideErrors={props.hideErrors}
      useSameSpace={props.useSameSpace}
      backTrasnparent={props.backTrasnparent}
      hideExpandFull={props.hideExpandFull}
      showSmallHelp={props.showSmallHelp}
      sample={props.sample}
      validateOnCall
      validateProjectId={props.projectId}
      ref={props.refEditor}
      value={value}
      onChange={onChange}
      height={props.height ?? 250}
      dictObjects={dictObjects}
      listObjects={listObjects ?? Utils.emptyStaticArray()}
      listProperties={dictObjects == null || _.isEmpty(dictObjects) ? listProperties : null /*listProperties ?? Utils.emptyStaticArray()*/}
      useInternal
    />
  );
});

export default EditorElemForDataset;
