import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useImperativeHandle, useReducer, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import Dropzone from 'react-dropzone';
import { useSelector } from 'react-redux';
import Constants from '../../constants/Constants';
const s = require('./DropFiles.module.css');
const { FILE } = NativeTypes;

interface IDropFilesProps {
  style?: any;
  useBorder?: boolean;
  onRef?: (p: any) => void;

  accepts: string[];
  onDrop: (files: any[]) => void;
  // isOver: boolean,
  // canDrop: boolean,
}

const DropFiles = React.memo(
  React.forwardRef((props: PropsWithChildren<IDropFilesProps>, ref: any) => {
    const { paramsProp, authUser } = useSelector((state: any) => ({
      paramsProp: state.paramsProp,
      authUser: state.authUser,
    }));

    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
    const dropzone = useRef(null);

    const [collectedProps, drop] = useDrop(
      () => ({
        accept: FILE,
        drop: (item, monitor) => {
          if (props.onDrop) {
            if (monitor) {
              let filesList = (monitor.getItem() as any).files;
              props.onDrop?.(filesList);
            }
          }
        },
        collect: (monitor) => {
          return {
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
          };
        },
      }),
      [props.onDrop],
    );

    useEffect(() => {
      props.onRef?.(this);

      return () => {
        props.onRef?.(null);
      };
    }, []);

    const openDialog = () => {
      dropzone.current?.open();
    };

    const onDropOpenDialog = (files) => {
      props.onDrop?.(files);
    };

    let styleRoot = _.assign({}, props.style || {});

    let { isOver, canDrop } = collectedProps;
    if (props.useBorder) {
      let colorBorder = 'transparent';
      if (isOver) {
        colorBorder = Constants.blue;
      }
      styleRoot.border = '2px solid ' + colorBorder;
    }

    useImperativeHandle(
      ref,
      () => ({
        openDialog: () => {
          dropzone.current?.open();
        },
      }),
      [dropzone.current],
    );

    return (
      <div style={styleRoot} className={s.root} ref={drop}>
        <Dropzone ref={dropzone} onDrop={onDropOpenDialog}>
          {({ getRootProps, getInputProps }) => (
            <div style={{ display: 'none' }}>
              <input {...getInputProps()} />
            </div>
          )}
        </Dropzone>
        {props.children}
      </div>
    );
  }),
);

export default DropFiles;
