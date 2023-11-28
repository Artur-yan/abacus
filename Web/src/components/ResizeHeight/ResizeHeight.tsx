import * as React from 'react';
import { useState } from 'react';
import { Rnd } from 'react-rnd';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
const s = require('./ResizeHeight.module.css');
const sd = require('../antdUseDark.module.css');

interface IResizeHeightProps {
  height?: number;
  children?: (height, width?) => any;
  save?: string;
  min?: number;
  max?: number;
}

const ResizeHeight = React.memo((props: IResizeHeightProps) => {
  const computedHeight = props.height ?? 200;
  const [height, setHeight] = useState(props.save ? Utils.dataNum(props.save, computedHeight) : computedHeight);

  //TODO //** ariel remove border hack
  return (
    <div
      css={`
        position: relative;
        height: ${height}px;
        border: 1px solid transparent;
        margin: 0;
      `}
    >
      <AutoSizer disableHeight>
        {({ width }) => (
          <Rnd
            disableDragging={true}
            enableResizing={{ bottom: true }}
            size={{ width, height }}
            position={{ x: 0, y: 0 }}
            onResize={(e, direction, ref, delta, position) => {
              let hh1 = ref.offsetHeight;
              if (props.min != null && hh1 < props.min) {
                hh1 = props.min;
              }
              if (props.max != null && hh1 > props.max) {
                hh1 = props.max;
              }

              setHeight(hh1);
            }}
            onResizeStop={(e, dir, ref, delta, position) => {
              let hh1 = ref.offsetHeight;
              if (props.min != null && hh1 < props.min) {
                hh1 = props.min;
              }
              if (props.max != null && hh1 > props.max) {
                hh1 = props.max;
              }

              setHeight(hh1);
              if (props.save) {
                Utils.dataNum(props.save, undefined, hh1);
              }
            }}
          >
            {props.children?.(height - 5, width)}
            <div
              css={`
                height: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
              `}
            >
              = = =
            </div>
          </Rnd>
        )}
      </AutoSizer>
    </div>
  );
});

export default ResizeHeight;
