import * as React from 'react';
import REActions from '../../actions/REActions';
const s = require('./SelectExtSpan.module.css');
// import { OptionProps, } from 'react-select/src/types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PropsWithChildren, useEffect, useReducer } from 'react';
import { useDrag } from 'react-dnd';
import { DragFieldTarget } from '../DatasetSchema/DatasetSchema';

interface ISelectExtSpanProps {
  value?: any;
  onClickCrossDrag?: (e: any) => void;
  onDropOnAnother?: (item: any) => void;

  // isDragging?,
  // connectDragSource?,
}

const SelectExtSpan = React.memo((props: PropsWithChildren<ISelectExtSpanProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [collected, drag, dragPreview] = useDrag(
    () => ({
      type: DragFieldTarget,
      item: { value: props.value, isDragFieldSchema: true, onDropOnAnother: props.onDropOnAnother },
      collect: (monitor) => {
        return {
          // connectDragSource: connect.dragSource(),
          isDragging: monitor.isDragging(),
        };
      },
      isDragging: (monitor) => {
        return (monitor.getItem() as any).value === props.value;
      },
      end: (draggedItem, monitor) => {
        if (!monitor.didDrop()) {
          return;
        }

        const item = monitor.getItem();
        const dropResult = monitor.getDropResult();
      },
      canDrag: (monitor) => {
        return true;
      },
    }),
    [props.value, props.onDropOnAnother],
  );

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const uploadsRefresh = (uploadId?: string) => {
    forceUpdate();
  };

  useEffect(() => {
    const unDark = REActions.onDarkModeChanged.listen(uploadsRefresh);

    return () => {
      unDark();
    };
  }, []);

  const onClickCrossDrag = (e) => {
    props.onClickCrossDrag?.(e);
  };

  let value1 = props.value?.label;
  let hideCross = props.value?.hideCross === true;

  let spanDrag: any = [];
  let valueSpan = (
    <span style={{ fontSize: '13px', padding: '2px 14px 4px', fontWeight: 600, color: '#8ca2f8', backgroundColor: '#2c323b', borderRadius: '12px', cursor: 'move' }}>
      {spanDrag}
      {value1}
      {!hideCross && <FontAwesomeIcon onClick={onClickCrossDrag} icon={['fas', 'times']} transform={{ size: 14, x: 0, y: 0 }} style={{ color: 'white', marginLeft: '6px', cursor: 'pointer' }} />}
    </span>
  );

  // return collected.isDragging ? (
  //   <div ref={dragPreview} />
  // ) : (
  return (
    <span ref={drag} {...collected}>
      {valueSpan}
    </span>
  );
});

export default SelectExtSpan;
