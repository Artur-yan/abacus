import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./PythonPromptAdv.module.css');
const sd = require('../antdUseDark.module.css');

interface IPythonPromptAdvProps {
  projectId?: any;
}

const PythonPromptAdv = React.memo((props: PropsWithChildren<IPythonPromptAdvProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [promptProcessing, setPromptProcessing] = useState(false);
  const [promptIntProcessing, setPromptIntProcessing] = useState(false);

  const [promptBounce, setPromptBounce] = useState('Compute Nth Fibbonaci number');
  const [promptIntBounce, setPromptIntBounce] = useState('');

  const [filterCodeBounce, setFilterCodeBounce] = useState('');
  const [filterCode, setFilterCode] = useState('');

  const projectId = props.projectId;

  const hh1 = 160;

  const onClickClearOpen = (e) => {
    setPromptIntBounce('');
  };

  const onClickClearPrompt = (e) => {
    setPromptBounce('');
  };

  const onClickCallOpen = (e) => {
    if (_.trim(promptIntBounce || '') === '') {
      REActions.addNotificationError('Prompt text required!');
      return;
    }

    setPromptIntProcessing(true);
    REClient_.client_()._callOpenAi(promptIntBounce, null, 'python', (err, res) => {
      setPromptIntProcessing(false);

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let code = res?.result?.resultText || null;
        if (_.trim(code || '') === '') {
          code = null;
        }
        setFilterCodeBounce(code ?? '');
      }
    });
  };

  const onClickUsePrompt = (e) => {
    if (_.trim(promptBounce || '') === '') {
      REActions.addNotificationError('Prompt text required!');
      return;
    }

    setPromptProcessing(true);
    REClient_.client_()._internalGetPythonSuggestion(promptBounce, projectId, (err, res) => {
      setPromptProcessing(false);

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let open1 = res?.result?.openAiPrompt || null;
        if (_.trim(open1 || '') === '') {
          open1 = null;
        }
        setPromptIntBounce(open1 ?? '');

        let code = res?.result?.generatedPython || null;
        if (_.trim(code || '') === '') {
          code = null;
        }
        setFilterCodeBounce(code ?? '');
      }
    });
  };

  const onClickClearCode = (e) => {
    setFilterCodeBounce('');
  };

  const onClickUseFilterCodeRun = (e) => {
    let code = filterCodeBounce;
    if (_.trim(code || '') === '') {
      code = null;
    }
    setFilterCode(code);
  };

  const onChangeCodePromptInt = (value) => {
    setPromptIntBounce(value);
  };

  const onChangeCodeFilter = (value) => {
    setFilterCodeBounce(value);
  };

  const onChangeCodePrompt = (value) => {
    setPromptBounce(value);
  };

  return (
    <div>
      <div>
        <div
          css={`
            position: relative;
          `}
        >
          <div
            css={`
              text-transform: uppercase;
              font-family: Roboto;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1.12px;
              color: #ffffff;
              margin-bottom: 5px;
            `}
          >
            <span>INPUT TEXT BELOW</span>
            {_.trim(promptBounce || '') !== '' && (
              <span
                css={`
                  margin-left: 10px;
                `}
                onClick={onClickClearPrompt}
              >
                <TooltipExt title={'Clear Text'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faXmarkCircle').faXmarkCircle} transform={{ size: 17, x: 0, y: 0 }} />
                </TooltipExt>
              </span>
            )}
          </div>
          <div
            css={`
              position: relative;
              height: ${hh1}px;
            `}
          >
            {<EditorElemForFeatureGroup lang={'plaintext'} backTrasnparent hideExpandFull projectId={projectId} height={hh1} value={promptBounce} onChange={onChangeCodePrompt} />}
          </div>
          <div
            css={`
              display: flex;
              margin-top: 20px;
            `}
          >
            <div>
              <Button disabled={promptProcessing === true || _.trim(promptBounce || '') === ''} type={'primary'} style={{ width: '100%' }} onClick={onClickUsePrompt}>
                <span>Generate Python Code</span>
                <span
                  css={`
                    margin-left: 5px;
                  `}
                >
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faAngleRight').faAngleRight} transform={{ size: 15, x: 0, y: 0 }} />
                </span>
                {promptProcessing === true && (
                  <span
                    css={`
                      margin-left: 10px;
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        css={`
          margin-top: 17px;
        `}
      >
        <div
          css={`
            position: relative;
          `}
        >
          <div
            css={`
              text-transform: uppercase;
              font-family: Roboto;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1.12px;
              color: #ffffff;
              margin-bottom: 5px;
            `}
          >
            <span>{'Prompt Generated'.toUpperCase()}</span>
            {_.trim(promptIntBounce || '') !== '' && (
              <span
                css={`
                  margin-left: 10px;
                `}
                onClick={onClickClearOpen}
              >
                <TooltipExt title={'Clear'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faXmarkCircle').faXmarkCircle} transform={{ size: 17, x: 0, y: 0 }} />
                </TooltipExt>
              </span>
            )}
          </div>
          <div
            css={`
              position: relative;
              height: ${hh1}px;
              width: 100%;
            `}
          >
            {<EditorElemForFeatureGroup lang={'python'} backTrasnparent hideExpandFull height={hh1} value={promptIntBounce} onChange={onChangeCodePromptInt} />}
          </div>
          <div
            css={`
              display: flex;
              margin-top: 20px;
            `}
          >
            <div>
              <Button disabled={promptIntProcessing === true || _.trim(promptIntBounce || '') === ''} type={'primary'} style={{ width: '100%' }} onClick={onClickCallOpen}>
                <span>Call</span>
                {promptIntProcessing === true && (
                  <span
                    css={`
                      margin-left: 10px;
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        css={`
          margin-top: 17px;
        `}
      >
        <div
          css={`
            position: relative;
          `}
        >
          <div
            css={`
              text-transform: uppercase;
              font-family: Roboto;
              font-size: 12px;
              font-weight: bold;
              letter-spacing: 1.12px;
              color: #ffffff;
              margin-bottom: 5px;
            `}
          >
            <span>{'Generated Python'.toUpperCase()}</span>
            {_.trim(filterCodeBounce || '') !== '' && (
              <span
                css={`
                  margin-left: 10px;
                `}
                onClick={onClickClearCode}
              >
                <TooltipExt title={'Clear Code'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faXmarkCircle').faXmarkCircle} transform={{ size: 17, x: 0, y: 0 }} />
                </TooltipExt>
              </span>
            )}
          </div>
          <div
            css={`
              position: relative;
              height: ${hh1}px;
              width: 100%;
            `}
          >
            {<EditorElemForFeatureGroup lang={'python'} hideErrors backTrasnparent hideExpandFull={false} height={hh1} value={filterCodeBounce} onChange={onChangeCodeFilter} />}
          </div>
          <div
            css={`
              display: flex;
              margin-top: 20px;
            `}
          >
            <div
              css={`
                flex: 1;
                font-size: 14px;
                color: #5b6d85;
                line-height: 1.7;
              `}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PythonPromptAdv;
