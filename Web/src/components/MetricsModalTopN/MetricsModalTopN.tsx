import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./MetricsModalTopN.module.css');
const sd = require('../antdUseDark.module.css');

interface IMetricsModalTopNProps {
  optionsSortByClass?: any;
  thresholdTopNRows?: any;
  maxTopN?: any;
  thresholdSortByClass?: any;
  classSel1?: any;
  topNDefault?: any;
  defaultSortByClass?: any;

  onChange?: (newValue: { thresholdTopNRows?; thresholdSortByClass? }) => void;
}

const MetricsModalTopN = React.memo((props: PropsWithChildren<IMetricsModalTopNProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [thresholdTopNRows, setThresholdTopNRows] = useState(props.thresholdTopNRows ?? props.topNDefault ?? null);
  const [thresholdSortByClass, setThresholdSortByClass] = useState(props.thresholdSortByClass ?? props.defaultSortByClass ?? null);

  const onChangeTopN = (v1) => {
    setThresholdTopNRows(v1);

    props.onChange?.({ thresholdTopNRows: v1, thresholdSortByClass: thresholdSortByClass });
  };

  const onChangeSortByClass = (o1) => {
    setThresholdSortByClass(o1?.value);

    props.onChange?.({ thresholdTopNRows: thresholdTopNRows, thresholdSortByClass: o1?.value });
  };

  return (
    <div
      css={`
        padding: 20px 20px;
        border-radius: 5px;
        margin: 10px 0 10px 10px;
        flex: 1;
      `}
      className={sd.grayPanel}
    >
      <div
        css={`
          text-align: center;
          margin: 2px 0 20px;
          font-size: 14px;
        `}
      >
        Confusion matrix and PR curve computed over {props.topNDefault} test points.
        <br />
        Change to compute only on top {thresholdTopNRows} predictions sorted by class '{props.optionsSortByClass?.find((o1) => o1.value == thresholdSortByClass)?.label || '-'}' probability
      </div>
      <div
        css={`
          gap: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <span
          css={`
            display: flex;
            gap: 5px;
            flex-direction: column;
          `}
        >
          <div
            css={`
              font-size: 14px;
              margin-right: 5px;
            `}
          >
            Top N Predictions:
          </div>
          <div
            css={`
              width: 200px;
            `}
          >
            <InputNumber
              css={`
                width: 100%;
              `}
              min={0}
              max={props.maxTopN}
              precision={0}
              value={thresholdTopNRows}
              onChange={onChangeTopN}
            />
          </div>
        </span>

        <span
          css={`
            display: flex;
            gap: 5px;
            flex-direction: column;
          `}
        >
          <div
            css={`
              font-size: 14px;
              margin-right: 5px;
            `}
          >
            Sort By Class:
          </div>
          <div
            css={`
              width: 200px;
            `}
          >
            <SelectExt options={props.optionsSortByClass} value={props.optionsSortByClass?.find((o1) => o1.value == (thresholdSortByClass ?? props.defaultSortByClass))} onChange={onChangeSortByClass} />
          </div>
        </span>
      </div>
      {/*<div css={`display: flex; justify-content: center; margin-top: 22px;`}>*/}
      {/*  <Button disabled={Utils.isNullOrEmpty(thresholdSortByClass) || thresholdTopNRows==null} type={'primary'} size={'small'} onClick={onClickSubmitSecond}>Submit</Button>*/}
      {/*  <Button css={`margin-left: 10px;`} type={'primary'} size={'small'} onClick={onClickClearSecond}>Clear</Button>*/}
      {/*</div>*/}
    </div>
  );
});

export default MetricsModalTopN;
