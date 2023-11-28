import Tabs from 'antd/lib/tabs';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import docs from '../../stores/reducers/docs';
import EditorElem from '../EditorElem/EditorElem';
const s = require('./SearchUsageMethod.module.css');
const sd = require('../antdUseDark.module.css');
const { TabPane } = Tabs;

interface ISearchUsageMethodProps {
  collection?: string;
  nameMethod?: string;
}

const SearchUsageMethod = React.memo((props: PropsWithChildren<ISearchUsageMethodProps>) => {
  const { paramsProp, authUser, docsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    docsParam: state.docs,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [lang, setLang] = useState(null);
  const [langList, setLangList] = useState(null);

  useEffect(() => {
    docs.memCodeSample(true, props.nameMethod);
  }, [props.nameMethod, docsParam]);
  const sampleCode = useMemo(() => {
    return docs.memCodeSample(false, props.nameMethod);
  }, [props.nameMethod, docsParam]);

  const example1 = useMemo(() => {
    return sampleCode?.examples?.[0];
  }, [sampleCode]);

  useEffect(() => {
    let kk = Object.keys(example1 ?? {});

    setLangList(kk);
    setLang((lang1) => {
      if (kk.includes('python')) {
        lang1 = 'python';
      } else {
        lang1 = kk[0];
      }

      return lang1;
    });
  }, [example1]);

  return (
    <div css={``}>
      <Tabs
        defaultActiveKey={lang}
        className={'useDark'}
        css={`
          .ant-tabs-tab-btn {
            color: white;
          }
          .ant-tabs-nav::before {
            border-bottom-color: rgba(255, 255, 255, 0.1) !important;
          }
        `}
      >
        {langList?.map((l1, l1ind) => {
          return (
            <TabPane tab={<span>{Utils.upperFirst(l1)}</span>} key={l1} className={'useDark'}>
              <EditorElem lang={l1 === 'curl' ? 'shell' : l1} value={example1?.[l1]?.input ?? ''} readonly height={120} />
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );
});

export default SearchUsageMethod;
