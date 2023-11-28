import React, { PropsWithChildren, useMemo } from 'react';

export interface MarkProps {
  key: string;
  content: string;
  start: number;
  end: number;
  tag: string;
  color?: string;
  onClick: (any) => any;
}

const Mark = React.memo((props: PropsWithChildren<MarkProps>) => {
  const renderText = useMemo(() => {
    if (props.content == null) {
      return props.content;
    }

    if (props.content === '\n') {
      return <br />;
    }

    // if(props.content.indexOf('\n')>-1) {
    //   let cc = props.content.split('\n');
    //   let res = [];
    //   cc.some((c1, c1ind) => {
    //     if(c1ind>0) {
    //       res.push(<br />);
    //     }
    //     res.push(c1);
    //   });
    //   return res;
    //
    // } else {
    return props.content;
    // }
  }, [props.content]);

  return (
    <mark style={{ backgroundColor: props.color || '#84d2ff', padding: '0 4px' }} data-start={props.start} data-end={props.end} onClick={() => props.onClick({ start: props.start, end: props.end })}>
      {renderText}
      {props.tag && <span style={{ fontSize: '0.7em', fontWeight: 500, marginLeft: 6 }}>{props.tag}</span>}
    </mark>
  );
});

export default Mark;
