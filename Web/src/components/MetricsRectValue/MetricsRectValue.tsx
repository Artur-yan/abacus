import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
import { useSelector } from 'react-redux';
const s = require('./MetricsRectValue.module.css');
const sd = require('../antdUseDark.module.css');

interface IMetricsRectValueProps {
  value?: any;
  title?: any;
  onClick?: (e) => void;
  isSmall?: boolean;
  dataClusterTypeText?: string;
}

const MetricsRectValue = React.memo((props: PropsWithChildren<IMetricsRectValueProps>) => {
  const {
    paramsProp,
    authUser,
    alerts: alertsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    alerts: state.alerts,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  return (
    <div
      onClick={props.onClick}
      css={`
        position: relative;
        display: inline-block;
        margin: -25px ${props.isSmall ? 21 : 31}px -35px 0;
        cursor: pointer;
      `}
    >
      <div
        css={`
          height: ${props.isSmall ? 92 : 108}px;
          min-width: ${props.isSmall ? 120 : 192}px;
          padding: 0 3px;
          box-shadow: 0 2px 40px 0 rgba(0, 0, 0, 0.2);
          background-image: linear-gradient(223deg, rgba(207, 82, 254, 0.5), rgba(16, 72, 82, 0.5)), linear-gradient(to bottom, #23305e, #23305e);
        `}
      >
        <div
          css={`
            height: ${(props.isSmall ? 54 : 66) - (props.dataClusterTypeText ? 13 : 0)}px;
            margin-top: 12px;
            padding-top: ${props.dataClusterTypeText ? 1 : 7}px;
            font-family: Roboto;
            font-size: ${props.isSmall ? 28 : 42}px;
            font-weight: 500;
            letter-spacing: 1px;
            color: #ffffff;
          `}
        >
          {props.value}
        </div>

        <div
          css={`
            opacity: 0.6;
            font-family: Roboto;
            font-size: ${props.isSmall ? 14 : 18}px;
            font-weight: 500;
            letter-spacing: 1px;
            color: #ffffff;
          `}
        >
          {props.title}
        </div>

        {props.dataClusterTypeText && (
          <div
            css={`
              margin-top: 4px;
              opacity: 0.6;
              font-family: Roboto;
              font-size: ${(props.isSmall ? 14 : 18) - 5}px;
              font-weight: 300;
              letter-spacing: 1px;
              color: #ffffff;
            `}
          >
            {props.dataClusterTypeText}
          </div>
        )}
      </div>
    </div>
  );
});

export default MetricsRectValue;
