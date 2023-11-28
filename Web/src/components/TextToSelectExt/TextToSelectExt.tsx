import * as React from 'react';
import { PropsWithChildren, useState } from 'react';
const styles = require('./TextToSelectExt.module.css');
const sd = require('../antdUseDark.module.css');

interface ITextToSelectExtProps {
  expanded?: any;
}

const TextToSelectExt = React.memo((props: PropsWithChildren<ITextToSelectExtProps>) => {
  const [isExpanded, setIsExpanded] = useState(!!props.expanded);

  if (!isExpanded) {
    return (
      <span onClick={() => setIsExpanded(true)} className={styles.label}>
        Select Another Version
      </span>
    );
  }

  return <span>{props.children}</span>;
});

export default TextToSelectExt;
