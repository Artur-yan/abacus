import _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useReducer } from 'react';
import { useDrop } from 'react-dnd';
import Constants from '../../constants/Constants';
import { DragFieldTarget } from '../DatasetSchema/DatasetSchema';
const s = require('./SelectExtDrop.module.css');

interface ISelectExtDropProps {
  value?: any;
  onClick?: (e: any) => void;
  onDropThis?: (item: any) => void;
}

const SelectExtDrop = React.memo((props: PropsWithChildren<ISelectExtDropProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [collectedProps, drop] = useDrop(
    () => ({
      accept: DragFieldTarget,
      canDrop: (item, monitor) => {
        const item1 = monitor.getItem() as any;
        return item1?.isDragFieldSchema && !_.isEqual(item1?.value, props.value);
      },
      drop: (item, monitor) => {
        if (monitor.didDrop()) {
          return;
        }

        const item1 = monitor.getItem() as any;
        if (item1?.isDragFieldSchema) {
          const canDrop = monitor.canDrop();
          if (canDrop) {
            item1.onDropOnAnother?.(item1);
            props.onDropThis?.(item1);
          }
        }
      },
      collect: (monitor) => {
        return {
          isOver: monitor.isOver(),
          isOverCurrent: monitor.isOver({ shallow: true }),
          canDrop: monitor.canDrop(),
          itemType: monitor.getItemType(),
        };
      },
    }),
    [props.value],
  );

  const onClickBackDrag = (e) => {
    props.onClick?.(e);
  };

  const { isOver, canDrop } = collectedProps as any;

  let styleRoot: CSSProperties = { padding: '5px', position: 'absolute', top: '1px', left: '1px', right: '30px', bottom: '1px', background: '#101720', cursor: 'pointer' };
  if (isOver && canDrop) {
    styleRoot.top = 0;
    styleRoot.bottom = 0;
    styleRoot.left = 0;
    styleRoot.right = 0;
    styleRoot.border = '2px solid ' + Constants.blue;
  }
  return (
    <div onClick={onClickBackDrag} style={styleRoot} ref={drop}>
      {props.children}
    </div>
  );
});

export default SelectExtDrop;
