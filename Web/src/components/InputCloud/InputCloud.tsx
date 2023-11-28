import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useRef } from 'react';
import { ReactLazyExt } from '../../../core/Utils';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
const s = require('./InputCloud.module.css');
const sd = require('../antdUseDark.module.css');
const CloudBrowser = ReactLazyExt(() => import('../CloudBrowser/CloudBrowser'));

interface IInputCloudProps {
  placeholder?: string;
  filterPrefix?: string;

  value?: any;
  onChange?: (e) => void;
}

const InputCloud = React.memo((props: PropsWithChildren<IInputCloudProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const refInput = useRef(null);
  const refPathSel = useRef(null);

  const cloudBrowser = useMemo(() => {
    const onSelect = (path1) => {
      refPathSel.current = path1;
    };

    return (
      <div className={'useDark'}>
        <div
          css={`
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 5px 0;
            text-align: center;
          `}
        >
          Cloud Browser
        </div>
        <div css={``}>
          <React.Suspense fallback={<span></span>}>
            <CloudBrowser height={460} onSelect={onSelect} filterPrefix={props.filterPrefix} defaultValue={props.value} />
          </React.Suspense>
        </div>
      </div>
    );
  }, [props.filterPrefix, props.value]);

  const onClickOk = (e) => {
    if (refInput.current) {
      let v1 = refPathSel.current ?? '';

      if (props.onChange != null) {
        props.onChange?.({ target: { value: v1 } });
      } else {
        refInput.current.input.value = v1;
      }
    }
  };

  const suffix = useMemo(() => {
    return (
      <ModalConfirm width={'1200px'} maskClosable={false} onConfirm={onClickOk} title={cloudBrowser} okText={'Select'} cancelText={'Cancel'} okType={'primary'}>
        <Button size={'small'} type={'primary'}>
          Browse..
        </Button>
      </ModalConfirm>
    );
  }, [cloudBrowser]);

  return (
    <>
      <Input
        onChange={props.onChange}
        value={props.value}
        ref={refInput}
        css={`
          & .ant-input.ant-input {
            border: none !important;
          }
        `}
        placeholder={props.placeholder}
        suffix={suffix}
      />
    </>
  );
});

export default InputCloud;
