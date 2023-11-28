import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import HelpIcon from '../HelpIcon/HelpIcon';

const styles = require('./MetricsFolderOne.module.css');
const sd = require('../antdUseDark.module.css');

export interface IMetricsFolderData {
  calcAllKeysSubUsed?: string[];
  hideHeader?: boolean;
  defaultExpand?: boolean;
  name?: string;
  internalName?: string;
  extraParams?: any;
  values?: {
    key?: string;
    name?: string;
    //intenral
    isMain?: boolean;
    isValidation?: boolean;
  }[];
  subFolders?: IMetricsFolderData[];
}

interface IMetricsFolderOneProps {
  data?: IMetricsFolderData;
  dataValue?: {
    key?: string;
    name?: string;

    isMain?: boolean;
    isValidation?: boolean;
  };
  useColorBack?: string;
  modelVersion?: string;
  dataClusterType?: string;
  indent?: number;
  renderTable?: (detailedMetrics, m1use, isFirstTable, backColor, onlyContent, isFolderTable) => any;
  algoName?: string;
  m1?: any;
  isFirstTable?: boolean;
  foldersCache?: { processingKeys?: string[]; addProcessingKey?: (key) => void; openKeys?: string[]; setOpenKeys?: (keys: string[]) => void; data?: any; setData?: (value) => void };
  processNewDataAdditional?: (dataValueKey, data) => void;
}

const MetricsFolderOne = React.memo((props: PropsWithChildren<IMetricsFolderOneProps>) => {
  const [everIsExpanded, setEverIsExpanded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const dataActualExpandKeyName = Utils.isNullOrEmpty(props.data?.name) ? null : props.data?.name;
  const dataValueKey = props.dataValue?.key;
  const dataValueAdditionalExpandingMetricsKeys = props.m1?.additionalExpandingMetricsKeys;
  const dataValueValidation = props.dataValue?.isValidation;
  const dataValueIsMain = props.dataValue?.isMain;
  const valueOneData = Utils.isNullOrEmpty(dataValueKey) ? null : props.foldersCache?.data?.[dataValueKey];

  useEffect(() => {
    if (props.data?.defaultExpand === true || props.data?.hideHeader === true) {
      setEverIsExpanded((e1) => {
        if (!e1) {
          e1 = true;
          setIsExpanded(true);
        }

        return e1;
      });
    }
  }, [props.data]);

  useEffect(() => {
    if (dataValueKey) {
      setEverIsExpanded((e1) => {
        if ((props.foldersCache?.openKeys?.includes(dataValueKey) === true) !== !!e1) {
          if (!e1) {
            e1 = true;
            setIsExpanded(true);
          } else {
            e1 = false;
            setIsExpanded(false);
          }
        }

        return e1;
      });
    }
  }, [props.foldersCache, dataValueKey]);

  useEffect(() => {
    if (dataActualExpandKeyName && !props.data?.hideHeader) {
      setEverIsExpanded((e1) => {
        if ((props.foldersCache?.openKeys?.includes(dataActualExpandKeyName) === true) !== !!e1) {
          if (!e1) {
            e1 = true;
            setIsExpanded(true);
          } else {
            e1 = false;
            setIsExpanded(false);
          }
        }

        return e1;
      });
    }
  }, [props.foldersCache, dataActualExpandKeyName, props.data]);

  const colorBack = useMemo(() => {
    if (props.useColorBack != null) {
      return props.useColorBack;
    } else {
      let name1 = props.data?.name?.toLowerCase();
      if (name1?.indexOf('validation') > -1) {
        return '#19232f'; //background color for validation metrics
      } else {
        return '#1d0f2f';
      }
    }
  }, [props.data, props.useColorBack]);

  const subFoldersElems = useMemo(() => {
    return props.data?.subFolders?.map((f1, f1ind) => {
      return (
        <MetricsFolderOne
          renderTable={props.renderTable}
          algoName={props.algoName}
          foldersCache={props.foldersCache}
          isFirstTable={props.isFirstTable}
          m1={props.m1}
          processNewDataAdditional={props.processNewDataAdditional}
          indent={(props.indent ?? 0) + (props.data?.hideHeader ? 0 : 1)}
          modelVersion={props.modelVersion}
          dataClusterType={props.dataClusterType}
          useColorBack={colorBack}
          key={'folder_' + f1ind + props.data?.name}
          data={f1}
        />
      );
    });
  }, [props.data, props.modelVersion, props.foldersCache, props.processNewDataAdditional, props.isFirstTable, props.algoName, props.m1]);

  const valuesElems = useMemo(() => {
    return props.data?.values?.map((f1, f1ind) => {
      return (
        <MetricsFolderOne
          renderTable={props.renderTable}
          algoName={props.algoName}
          foldersCache={props.foldersCache}
          isFirstTable={props.isFirstTable}
          m1={props.m1}
          processNewDataAdditional={props.processNewDataAdditional}
          indent={(props.indent ?? 0) + (props.data?.hideHeader ? 0 : 1)}
          modelVersion={props.modelVersion}
          dataClusterType={props.dataClusterType}
          useColorBack={colorBack}
          key={'folder_value_' + f1ind + props.data?.name}
          dataValue={f1}
        />
      );
    });
  }, [props.data, props.modelVersion, props.dataClusterType, props.foldersCache, props.processNewDataAdditional, props.isFirstTable, props.algoName, props.m1]);

  const onClickExpand = (e) => {
    setIsExpanded((e1) => {
      let res = !e1;
      if (res) {
        setEverIsExpanded(true);
      }

      if (!Utils.isNullOrEmpty(dataValueKey) || !Utils.isNullOrEmpty(dataActualExpandKeyName)) {
        let kk = [...(props.foldersCache?.openKeys ?? [])];
        if (!Utils.isNullOrEmpty(dataValueKey)) {
          if (res) {
            if (!kk.includes(dataValueKey)) {
              kk.push(dataValueKey);
            }
          } else {
            kk = kk.filter((v1) => v1 !== dataValueKey);
          }
        }
        if (!Utils.isNullOrEmpty(dataActualExpandKeyName)) {
          if (res) {
            if (!kk.includes(dataActualExpandKeyName)) {
              kk.push(dataActualExpandKeyName);
            }
          } else {
            kk = kk.filter((v1) => v1 !== dataActualExpandKeyName);
          }
        }
        props.foldersCache?.setOpenKeys(kk);
      }

      return res;
    });
  };

  const valueOneDataUsed = useMemo(() => {
    if (valueOneData == null || _.isEmpty(valueOneData)) {
      return null;
    } else {
      const findOtherMetricByKey = (otherMetrics, keyToFind) => {
        if (!otherMetrics) {
          return null;
        }

        if (!keyToFind) {
          return null;
        }

        let res = otherMetrics?.find((o1) => Object.keys(o1 ?? {})?.[0] === keyToFind);
        return Object.values(res ?? {})?.[0];
      };

      let m1use = findOtherMetricByKey(valueOneData?.otherMetrics, props.algoName);
      if (m1use == null) {
        return null;
      } else {
        return m1use;
      }
    }
  }, [valueOneData, props.algoName]);

  const dataValueGrid = useMemo(() => {
    if (valueOneDataUsed == null || _.isEmpty(valueOneDataUsed)) {
      return null;
    } else {
      return props.renderTable?.(props.m1?.detailedMetrics, valueOneDataUsed, props.isFirstTable, colorBack, true, true);
    }
  }, [valueOneDataUsed, props.isFirstTable, props.algoName, props.dataValue, props.renderTable, colorBack, props.m1]);

  const calcAllKeysSubUsed = props.data?.calcAllKeysSubUsed;

  const shouldHide = useMemo(() => {
    if (props.data?.hideHeader === true) {
      return false;
    }

    let mm = dataValueAdditionalExpandingMetricsKeys;
    if (mm != null && _.isArray(mm)) {
      mm = mm[0];
    }
    if (mm == null) {
      return true;
    }

    if (Utils.isNullOrEmpty(dataValueKey)) {
      if (calcAllKeysSubUsed != null) {
        let kk = Object.keys(mm ?? {});
        if (kk.some((k1) => calcAllKeysSubUsed.includes(k1))) {
          return false;
        } else {
          // console.warn('ttt', kk, calcAllKeysSubUsed)
          return true;
        }
      }
      return false;
    } else {
      return mm?.[dataValueKey] !== true;
    }
  }, [props.m1, dataValueKey, dataValueAdditionalExpandingMetricsKeys, calcAllKeysSubUsed, props.data]);

  const isAlreadyProcessing = useMemo(() => {
    return props.foldersCache?.processingKeys?.includes(dataValueKey);
  }, [props.foldersCache, dataValueKey]);

  const getDataCallAlready = useRef(false);
  useEffect(() => {
    if (!dataValueKey || !props.modelVersion || getDataCallAlready.current || isAlreadyProcessing) {
      return;
    }

    if (isExpanded) {
      getDataCallAlready.current = true;

      const cb1 = (err, res) => {
        if (!err && res?.result != null) {
          props.processNewDataAdditional?.(dataValueKey, res?.result);

          setTimeout(() => {
            setIsProcessing(false);
          }, 0);
        } else {
          setIsProcessing(false);
        }
      };

      props.foldersCache?.addProcessingKey?.(dataValueKey);

      setIsProcessing(true);
      if (dataValueIsMain) {
        REClient_.client_()._getMetricsDataByModelVersion(props.modelVersion, null, dataValueValidation === true ? true : undefined, undefined, undefined, props.dataClusterType, cb1);
      } else {
        REClient_.client_()._getAdditionalMetricsDataByModelVersion(props.modelVersion, dataValueKey, /*props.algoName*/ null, dataValueValidation === true ? true : undefined, props.dataClusterType, cb1);
      }
    }
  }, [isAlreadyProcessing, dataValueKey, props.modelVersion, props.dataClusterType, isExpanded, props.algoName, dataValueValidation, dataValueIsMain]);

  const renderHeader = (isExpanded, name) => {
    if (props.data?.hideHeader) {
      return null;
    }

    return (
      <tr>
        <td colSpan={9999}>
          <div
            onClick={onClickExpand}
            css={`
              background: ${colorBack};
            `}
            className={styles.header}
          >
            <span
              css={`
                width: ${(props.indent ?? 0) * 10}px;
                display: inline-block;
              `}
            ></span>
            <p className={props?.dataValue != null && props?.dataValue?.isValidation ? styles.valueHeader : styles.folderHeader}>
              <span
                css={`
                  width: 16px;
                  display: inline-block;
                  text-align: center;
                  margin-right: 4px;
                `}
              >
                {!isExpanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faChevronRight').faChevronRight} transform={{ size: 20, x: 0, y: 0 }} size="xs" />}
                {isExpanded && <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faChevronDown').faChevronDown} transform={{ size: 20, x: 0, y: 0 }} size="xs" />}
              </span>
            </p>
            <span>{name}</span>
            <HelpIcon id={'metrics_detail_session_based_metrics'} style={{ marginLeft: 4 }} />
          </div>
        </td>
      </tr>
    );
  };

  const processingElem = useMemo(() => {
    if (dataValueGrid != null || !isAlreadyProcessing) {
      return null;
    } else {
      return (
        <tr>
          <td
            colSpan={9999}
            css={`
              padding: 5px;
            `}
          >
            <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />
          </td>
        </tr>
      );
    }
  }, [isProcessing, dataValueGrid, isAlreadyProcessing]);

  if (shouldHide) {
    return null;
  }

  if (props.dataValue != null) {
    return (
      <>
        {renderHeader(isExpanded, props.dataValue?.name)}
        {everIsExpanded && isExpanded && (processingElem ?? dataValueGrid)}
      </>
    );
  }

  return (
    <>
      {renderHeader(isExpanded, props.data?.name)}
      {everIsExpanded && isExpanded && (
        <>
          {subFoldersElems}
          {valuesElems}
        </>
      )}
    </>
  );
});

export default MetricsFolderOne;
