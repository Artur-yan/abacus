import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { Notebook } from '@jupyterlab/notebook';
import { instanceOf } from 'prop-types';

import * as React from 'react';
import { CSSProperties } from 'react';

interface IContainerElem {
  notebook?: Notebook;
  style?: CSSProperties;
  className?: string;
}

const ContainerElem = React.memo((props: IContainerElem) => {
  const { notebook, style, className } = props;
  const containerElemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerElemRef.current;

    if (notebook && container) {
      container.innerHTML = '';
      container.insertAdjacentElement?.('afterbegin', notebook?.node);

      notebook?.widgets?.forEach((widget) => {
        widget.editor.refresh();
      });
    }
  }, [props.notebook]);

  return <div className={className} style={style} ref={containerElemRef}></div>;
});

export default ContainerElem;
