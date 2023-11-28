import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
const s = require('./HelpCustomRender.module.css');
const sd = require('../antdUseDark.module.css');

interface IHelpCustomRenderProps {
  doc?: string;
}

const HelpCustomRender = React.memo((props: PropsWithChildren<IHelpCustomRenderProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [resCall, setResCall] = useState(null as string);

  useEffect(() => {
    setResCall(null);
    if (props.doc) {
      REClient_.client_()._fetchDoc(props.doc, (err, res) => {
        if (err || !res?.success) {
          //
        } else if (_.isString(res?.result)) {
          setResCall(res?.result);
        }
      });
    }
  }, [props.doc]);

  const html1 = useMemo(() => {
    if (Utils.isNullOrEmpty(resCall)) {
      return null;
    } else {
      return { __html: resCall };
    }
  }, [resCall]);

  return <div dangerouslySetInnerHTML={html1}></div>;
});

export default HelpCustomRender;
