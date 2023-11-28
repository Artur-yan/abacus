import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import Utils from '../../../core/Utils';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./DataIntegrityOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IDataIntegrityOneProps {
  summary?: {
    targetColumn?: string;
    predictionDrift?: number;
    featureIndex: { distance; name: string; noOutliers }[];
    nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
    rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
    typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
    catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
  };
  name?: string;
  onClickCellTypeMismatch?: (row?, key?, e?) => void;
  onClickCatViolation?: (row?, e?) => void;
  fgMonitorType?: boolean;
  foldIntegrity?: boolean;
}

const DataIntegrityOne = React.memo((props: PropsWithChildren<IDataIntegrityOneProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const { summary, fgMonitorType = false } = props;

  const calcHeightTable = (hh, list) => {
    const rowHH = 56;

    let len = list?.length ?? 0;
    let h1 = rowHH + rowHH * len;

    return Math.min(hh, h1);
  };

  const detailData = useMemo(() => {
    return [
      {
        name: props.name ?? '',
        countNull: summary?.nullViolations?.length ?? 0,
        countType: summary?.typeViolations?.length ?? 0,
        countRange: summary?.rangeViolations?.length ?? 0,
        countCat: summary?.catViolations?.length ?? 0,
        total: (summary?.nullViolations?.length ?? 0) + (summary?.typeViolations?.length ?? 0) + (summary?.rangeViolations?.length ?? 0) + (summary?.catViolations?.length ?? 0),
      },
    ];
  }, [summary, props.name]);

  //Detail
  const columnsDetail = useMemo(() => {
    let res = [
      {
        title: '',
        field: 'name',
        hidden: props.name != null,
      },
      {
        title: 'null violations',
        field: 'countNull',
        align: 'center',
      },
      {
        title: 'type mismatch violations',
        field: 'countType',
        align: 'center',
        hidden: summary?.typeViolations == null,
      },
      {
        title: 'range violations',
        field: 'countRange',
        align: 'center',
      },
      {
        title: 'categorical range violations',
        field: 'countCat',
        hidden: summary?.catViolations == null,
        align: 'center',
      },
      {
        title: 'total violations',
        field: 'total',
        align: 'center',
      },
    ] as ITableExtColumn[];

    res = res?.filter((r1) => r1.hidden !== true);

    return res;
  }, [summary]);

  //Null Violations
  const columnsNullViolations = useMemo(() => {
    return [
      {
        title: 'Feature Name',
        field: 'name',
      },
      {
        align: 'right',
        title: `Freq. ${fgMonitorType ? 'Test' : 'Prediction'}`,
        field: props.foldIntegrity ? 'testFoldNullFrequency' : 'predictionNullFreq',
        render: (text, row, index) => {
          return <span data-training={'false'}>{Utils.decimals(text * 100, 2) + '%'}</span>;
        },
        width: 160,
        isLinked: props.onClickCellTypeMismatch != null,
      },
      {
        align: 'right',
        title: `Freq. ${fgMonitorType ? 'Reference' : 'Training'}`,
        field: props.foldIntegrity ? 'trainFoldNullFrequency' : 'trainingNullFreq',
        render: (text, row, index) => {
          return <span data-training={'true'}>{Utils.decimals(text * 100, 2) + '%'}</span>;
        },
        width: 160,
        isLinked: props.onClickCellTypeMismatch != null,
      },
      {
        title: 'Violation Reason',
        field: 'violation',
      },
    ] as ITableExtColumn[];
  }, [props.onClickCellTypeMismatch]);

  //Type Mismatch Feature Violations
  const columnsTypeMismatch = useMemo(() => {
    return [
      {
        title: 'Feature Name',
        field: 'name',
      },
      {
        title: `${fgMonitorType ? 'Reference' : 'Training'} Type`,
        field: 'trainingDataType',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'true'}>{text}</span>;
        },
      },
      {
        title: `${fgMonitorType ? 'Test' : 'Prediction'} Type`,
        field: 'predictionDataType',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'false'}>{text}</span>;
        },
      },
    ] as ITableExtColumn[];
  }, [props.onClickCellTypeMismatch]);

  //Categorical Feature Range Violations
  const columnsCatViolations = useMemo(() => {
    return [
      {
        title: 'Feature Name',
        field: 'name',
      },
      {
        title: 'Freq Outside Training Range',
        field: 'freqOutsideTrainingRange',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'true'}>{text == null ? null : Utils.decimals(text * 100, 2) + '%'}</span>;
        },
        width: 200,
      },
      {
        title: 'Most Common Values',
        field: 'mostCommonValues',
        render: (text, row, index) => {
          text = row.mostCommonValues;

          let res = null;
          if (_.isArray(text)) {
            res = (
              <span>
                {text?.map((t1, t1ind) => (
                  <span key={'t' + t1ind}>
                    {t1ind > 0 ? <span>, </span> : null}
                    {t1}
                  </span>
                ))}
              </span>
            );
          } else if (_.isString(text) || _.isNumber(text)) {
            res = '' + text;
          } else {
            return '-';
          }

          if (props.onClickCatViolation == null) {
            return res;
          } else {
            return (
              <span
                onClick={props.onClickCatViolation?.bind(null, row)}
                css={`
                  cursor: pointer;
                `}
              >
                {res}
              </span>
            );
          }
        },
        isLinked: props.onClickCatViolation != null,
      },
    ] as ITableExtColumn[];
  }, [props.onClickCatViolation, props.onClickCellTypeMismatch]);

  //Numerical Feature Range Violations
  const columnsRangeFeatures = useMemo(() => {
    return [
      {
        title: 'Feature Name',
        field: 'name',
      },
      {
        title: `${fgMonitorType ? 'Reference' : 'Training'} Range`,
        field: 'trainingMin',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'true'}>{'' + Utils.decimals(props.foldIntegrity ? row.testMin : row.trainingMin, 2) + '-' + Utils.decimals(props.foldIntegrity ? row.testMax : row.trainingMax, 2)}</span>;
        },
      },
      {
        title: `${fgMonitorType ? 'Test' : 'Prediction'} Range`,
        field: 'predictionMin',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'false'}>{'' + Utils.decimals(props.foldIntegrity ? row.trainMin : row.predictionMin, 2) + '-' + Utils.decimals(props.foldIntegrity ? row.trainMax : row.predictionMax, 2)}</span>;
        },
      },
      {
        title: 'Freq. Above Training Range',
        field: 'freqAboveTrainingRange',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'true'}>{text != null ? Utils.decimals(text * 100, 2) + '%' : ''}</span>;
        },
        width: 190,
      },
      {
        title: 'Freq. Below Training Range',
        field: 'freqBelowTrainingRange',
        isLinked: props.onClickCellTypeMismatch != null,
        render: (text, row, index) => {
          return <span data-training={'true'}>{text != null ? Utils.decimals(text * 100, 2) + '%' : ''}</span>;
        },
        width: 190,
      },
    ] as ITableExtColumn[];
  }, [props.onClickCellTypeMismatch]);

  const elemWW = 900;

  return (
    <>
      <div
        css={`
          margin: 0 15px;
        `}
      >
        <div
          css={`
            font-family: Matter;
            font-size: 18px;
            font-weight: 500;
            line-height: 1.78;
            margin-top: 10px;
            margin-bottom: 10px;
          `}
        >
          Detail
        </div>
        <TableExt prefixHelpIdForColumnsAuto={'dataIntegrity_detail'} dataSource={detailData} columns={columnsDetail} />
      </div>

      <div
        css={`
          display: flex;
          flex-flow: wrap;
        `}
      >
        {summary?.nullViolations?.length !== 0 && (
          <div
            css={`
              margin: 15px;
              width: ${elemWW}px;
            `}
          >
            <div
              css={`
                font-family: Matter;
                font-size: 18px;
                font-weight: 500;
                line-height: 1.78;
                margin-top: 10px;
                margin-bottom: 10px;
              `}
            >
              Null Violations
            </div>
            <TableExt
              prefixHelpIdForColumnsAuto={'dataIntegrity_nullViolations'}
              onClickCell={props.onClickCellTypeMismatch}
              height={calcHeightTable(340, summary?.nullViolations)}
              isVirtual
              dataSource={summary?.nullViolations}
              columns={columnsNullViolations}
            />
          </div>
        )}

        {summary?.typeViolations && summary?.typeViolations?.length !== 0 && (
          <div
            css={`
              margin: 15px;
              width: ${elemWW}px;
            `}
          >
            <div
              css={`
                font-family: Matter;
                font-size: 18px;
                font-weight: 500;
                line-height: 1.78;
                margin-top: 10px;
                margin-bottom: 10px;
              `}
            >
              Type Mismatch Feature Violations
            </div>
            <TableExt
              prefixHelpIdForColumnsAuto={'dataIntegrity_typeViolations'}
              onClickCell={props.onClickCellTypeMismatch}
              height={calcHeightTable(340, summary?.typeViolations)}
              isVirtual
              dataSource={summary?.typeViolations}
              columns={columnsTypeMismatch}
            />
          </div>
        )}

        {summary?.rangeViolations?.length !== 0 && (
          <div
            css={`
              margin: 15px;
              width: ${elemWW}px;
            `}
          >
            <div
              css={`
                font-family: Matter;
                font-size: 18px;
                font-weight: 500;
                line-height: 1.78;
                margin-top: 10px;
                margin-bottom: 10px;
              `}
            >
              Numerical Feature Range Violations
            </div>
            <TableExt
              prefixHelpIdForColumnsAuto={'dataIntegrity_rangeViolations'}
              onClickCell={props.onClickCellTypeMismatch}
              height={calcHeightTable(340, summary?.rangeViolations)}
              isVirtual
              dataSource={summary?.rangeViolations}
              columns={columnsRangeFeatures}
            />
          </div>
        )}

        {summary?.catViolations?.length !== 0 && (
          <div
            css={`
              margin: 15px;
              width: ${elemWW}px;
            `}
          >
            <div
              css={`
                font-family: Matter;
                font-size: 18px;
                font-weight: 500;
                line-height: 1.78;
                margin-top: 10px;
                margin-bottom: 10px;
              `}
            >
              Categorical Feature Range Violations
            </div>
            <TableExt
              prefixHelpIdForColumnsAuto={'dataIntegrity_catViolations'}
              onClickCell={props.onClickCellTypeMismatch}
              height={calcHeightTable(340, summary?.catViolations)}
              isVirtual
              dataSource={summary?.catViolations}
              columns={columnsCatViolations}
            />
          </div>
        )}
      </div>
    </>
  );
});

export default DataIntegrityOne;
