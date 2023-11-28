import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, RefObject, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import EditorElem from '../EditorElem/EditorElem';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import SeeMore from '../SeeMore/SeeMore';
const s = require('./EditorElemForFeatureGroup.module.css');
const sd = require('../antdUseDark.module.css');

interface IEditorElemForFeatureGroupProps {
  onlyThisFeatureGroup?: boolean;
  featureGroupId?: string;
  projectId?: string;
  refEditor?: RefObject<any>;
  validateFeatureGroupId?: string;
  validateFeatureTableName?: string;
  validateFeatureColumnName?: string;
  validateFeatureColumn?: boolean;
  validateTemplate?: boolean;
  onChange?: (name?, value?) => void;
  height?: number;
  value?: any;
  useSameSpace?: boolean;
  showSmallHelp?: boolean;
  readonly?: boolean;
  readSure?: boolean;
  lang?: string;
  sample?: string;
  allowResizeHeight?: string | boolean;
  hideExpandFull?: boolean;
  onChangeSelection?: (v1: string) => void;
  lineNumbers?: boolean;
  seeMore?: boolean;
  backTrasnparent?: boolean;
  hideErrors?: boolean;
  featureGroupVersionId?: string;
}

const nameExistsInArray = (arr: any[], name: string) => arr?.includes(name) || !!arr?.find?.((obj) => obj?.name === name);

const EditorElemForFeatureGroup = React.memo((props: PropsWithChildren<IEditorElemForFeatureGroupProps>) => {
  const { featureGroupsParam, projectsParam, useCasesParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
  }));

  const project = useMemo(() => {
    return memProjectById(props.projectId, false);
  }, [projectsParam, props.projectId]);

  const featureGroupsListProjectId = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, props.projectId);
  }, [featureGroupsParam, props.projectId]);

  const featureGroupsTableMap = useMemo(() => {
    let res: any = {};
    featureGroupsListProjectId?.forEach((featureGroup) => {
      res[featureGroup?.featureGroupId] = featureGroup?.tableName;
    });
    return res;
  }, [featureGroupsListProjectId, featureGroupsParam, props.projectId]);

  const featureGroupIds = useMemo(() => {
    let ids = props.featureGroupId ? [props.featureGroupId] : [];
    if (!props.onlyThisFeatureGroup) {
      ids = featureGroupsListProjectId?.map?.((featureGroup) => featureGroup.featureGroupId);
    }
    return ids;
  }, [featureGroupsListProjectId, featureGroupsParam, props.projectId, props.onlyThisFeatureGroup, props.featureGroupId]);

  const getFeatureGroupsList = (doCall: boolean) => {
    let res: any = {};
    const featureGroupsList = featureGroups.memFeatureGroupsIdList(doCall, featureGroupIds);
    featureGroupsList?.forEach((featureGroup) => {
      res[featureGroup?.featureGroupId] = featureGroup;
    });
    return res;
  };

  const featureGroupsList = useMemo(() => getFeatureGroupsList(false), [featureGroupIds]);

  const useCase = useMemo(() => project?.useCase, [project]);

  const useCaseInfo = useMemo(() => {
    return memUseCasesSchemasInfo(false, useCase);
  }, [useCasesParam, useCase]);

  const { listObjects, listProperties, dictObjects, extProperties } = useMemo(() => {
    let listObjects = new Set(),
      listProperties = [],
      dictObjects = {},
      extProperties = [];
    Object.entries(featureGroupsTableMap).forEach(([featureGroupId, tableName]: [featureGroupId: string, tableName: string]) => {
      const isEditingFeatureGroup = featureGroupId === props.featureGroupId;
      if (!tableName || (props.onlyThisFeatureGroup && !isEditingFeatureGroup)) {
        return;
      }

      let featureGroup = featureGroupsList?.[featureGroupId];
      const featureGroupSchema = featureGroup?.projectFeatureGroupSchema?.schema ?? featureGroup?.features;
      featureGroupSchema?.forEach((column: any) => {
        if (!column || column?.columns) {
          return;
        }

        listObjects.add(tableName);
        dictObjects[tableName] = dictObjects[tableName] || [];

        const columnName = column?.name;
        if (!columnName) {
          return;
        }
        if (!nameExistsInArray(dictObjects[tableName], columnName)) {
          dictObjects[tableName].push(column?.featureType ? columnName : { name: columnName, desc: column?.featureType });
        }

        const datasetId = featureGroup?.datasetId;
        if (datasetId && dictObjects[datasetId] && !nameExistsInArray(dictObjects[datasetId], columnName)) {
          dictObjects[datasetId].push(columnName);
        }
      });
    });

    Object.entries(dictObjects).forEach(([key, value]) => {
      if (_.isEmpty(value)) {
        delete dictObjects[key];
      }
    });

    if (!props.onlyThisFeatureGroup) {
      Object.entries(dictObjects).forEach(([key, value]: [key: string, value: any[]]) => {
        const columnString = value?.map?.((obj) => obj?.name || obj)?.join(',');
        if (columnString) {
          extProperties.push({ name: '* All Columns from ' + key, value: columnString });
        }
      });
    }

    const keys = Object.keys(dictObjects);
    if (keys.length === 1) {
      listProperties = dictObjects[keys[0]] || [];
      dictObjects = {};
    }

    return { listObjects: Array.from(listObjects), listProperties, dictObjects, extProperties };
  }, [featureGroupsTableMap, featureGroupsList, useCaseInfo, props.featureGroupId]);

  useEffect(() => {
    memProjectById(props.projectId, true);
  }, [projectsParam, props.projectId]);

  useEffect(() => {
    getFeatureGroupsList(true);
  }, [featureGroupIds]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, props.projectId);
  }, [featureGroupsParam, props.projectId]);

  useEffect(() => {
    memUseCasesSchemasInfo(true, useCase);
  }, [useCasesParam, useCase]);

  useEffect(() => {
    const currentFeatureGroupId = props.validateFeatureGroupId ?? props.featureGroupId;
    if (currentFeatureGroupId && props.projectId) {
      featureGroups.memFeatureGroupsForId(true, props.projectId, currentFeatureGroupId);
    }
  }, [props.validateFeatureGroupId, props.featureGroupId, props.projectId]);

  const { value, onChange } = props ?? ({} as any);

  let resHH = (height) => (
    <EditorElem
      useInternal
      ref={props.refEditor}
      hideErrors={props.hideErrors}
      backTrasnparent={props.backTrasnparent}
      onlyProgressAndErrors={props.readSure}
      lineNumbers={props.lineNumbers}
      onChangeSelection={props.onChangeSelection}
      readSure={props.readSure}
      hideExpandFull={props.readSure || props.hideExpandFull}
      sample={props.sample}
      lang={props.lang}
      readonly={props.readonly}
      extProperties={extProperties}
      showSmallHelp={props.showSmallHelp}
      useSameSpace={props.useSameSpace || !!props.allowResizeHeight}
      validateFeatureColumnName={props.validateFeatureColumnName}
      validateFeatureColumn={props.validateFeatureColumn}
      validateOnCall
      validateFeatureGroupId={props.validateFeatureGroupId ?? props.featureGroupId}
      validateProjectId={props.projectId}
      validateFeatureTableName={props.validateFeatureTableName}
      featureGroupVersionId={props.featureGroupVersionId}
      validateType={'FEATUREGROUP'}
      value={value}
      onChange={onChange}
      height={height}
      dictObjects={dictObjects}
      listObjects={listObjects ?? Utils.emptyStaticArray()}
      listProperties={dictObjects == null || _.isEmpty(dictObjects) ? listProperties : null}
    />
  );

  if (props.readSure) {
    return (
      <div
        css={`
          padding: 2px 4px 3px;
          color: #e8912d;
          white-space: pre-wrap;
          font-family: Monaco, Menlo, Consolas, Courier New, monospace !important;
          font-size: 12px;
          line-height: 1.50001;
          font-variant-ligatures: none;
          border: 1px solid rgba(232, 232, 232, 0.13);
          border-radius: 3px;
        `}
      >
        {UtilsWeb.enters(value)}
        <div
          css={`
            margin-top: 10px;
            font-family: Matter;
            white-space: normal;
            font-size: 14px;
          `}
        >
          {resHH(200)}
        </div>
      </div>
    );
  }

  let res;
  if (props.allowResizeHeight) {
    res = (
      <ResizeHeight height={props.height ?? 250} min={60} save={_.isString(props.allowResizeHeight) ? props.allowResizeHeight : undefined}>
        {(height) => resHH(height - 15)}
      </ResizeHeight>
    );
  } else {
    res = resHH(props.height ?? 250);
  }

  if (props.seeMore) {
    res = <SeeMore>{res}</SeeMore>;
  }

  return res;
});

export default EditorElemForFeatureGroup;
