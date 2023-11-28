import React, { PropsWithChildren, useRef } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import globalStyles from '../antdUseDark.module.css';
import styles from './PythonFunctionEdit.module.css';
import NanoScroller from '../NanoScroller/NanoScroller';
import NBEditor from '../NBEditor/NBEditor';
import { Card } from 'antd';
import Utils from '../../../core/Utils';

const cardStyles = {
  container: { height: '100%', boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: '#111111', borderRadius: '5px' },
  body: { height: '100%', padding: 0 },
};

interface PythonFunctionEditProps {}

const PythonFunctionEdit = (props: PropsWithChildren<PythonFunctionEditProps>) => {
  const scrollBarRef = useRef(null);
  const projectId = useSelector((state: any) => state.paramsProp?.get('projectId'));
  const notebookId = useSelector((state: any) => state.paramsProp?.get('notebookId'));
  const pythonFunctionId = useSelector((state: any) => state.paramsProp?.get('pythonFunctionId'));
  return (
    <div className={classNames(globalStyles.absolute, styles.container)}>
      <AutoSizer disableWidth>
        {({ height }) => (
          <div style={{ height }}>
            <Card style={cardStyles.container} className={globalStyles.grayPanel} bodyStyle={cardStyles.body}>
              <div className={styles.notebookContainer}>
                <NBEditor headlessMode notebookId={notebookId} key={`${pythonFunctionId}-${notebookId}`} />
              </div>
            </Card>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};
export default React.memo(PythonFunctionEdit);
