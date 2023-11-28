import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import EditorElemForDataset from '../EditorElemForDataset/EditorElemForDataset';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./PromptAdv.module.css');
const sd = require('../antdUseDark.module.css');

interface IPromptAdvProps {
  projectId?: any;
  featureGroupId?: any;
  isFeatureGroup?: any;
  datasetId?: any;
}

const PromptAdv = React.memo((props: PropsWithChildren<IPromptAdvProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [promptProcessing, setPromptProcessing] = useState(false);
  const [promptIntProcessing, setPromptIntProcessing] = useState(false);

  const [promptBounce, setPromptBounce] = useState('Show all columns from this table');
  const [filterSqlBounce, setFilterSqlBounce] = useState('');
  const [promptIntBounce, setPromptIntBounce] = useState('');
  const [filterSql, setFilterSql] = useState('');

  const projectId = props.projectId;
  const featureGroupId = props.featureGroupId;

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
    REClient_.client_()._callOpenAi(promptIntBounce, null, 'sql', (err, res) => {
      setPromptIntProcessing(false);

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let sql1 = res?.result?.resultText || null;
        if (_.trim(sql1 || '') === '') {
          sql1 = null;
        }
        setFilterSqlBounce(sql1 ?? '');
      }
    });
  };

  const onClickUsePrompt = (e) => {
    if (_.trim(promptBounce || '') === '') {
      REActions.addNotificationError('Prompt text required!');
      return;
    }

    setPromptProcessing(true);
    REClient_.client_()._internalGetSqlSuggestionForRawData(featureGroupId, promptBounce, projectId, (err, res) => {
      setPromptProcessing(false);

      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        let open1 = res?.result?.openAiPrompt || null;
        if (_.trim(open1 || '') === '') {
          open1 = null;
        }
        setPromptIntBounce(open1 ?? '');

        let sql1 = res?.result?.generatedSql || null;
        if (_.trim(sql1 || '') === '') {
          sql1 = null;
        }
        setFilterSqlBounce(sql1 ?? '');
      }
    });
  };

  const onClickClearSQL = (e) => {
    setFilterSqlBounce('');
  };

  const onClickUseFilterSqlRun = (e) => {
    let sql1 = filterSqlBounce;
    if (_.trim(sql1 || '') === '') {
      sql1 = null;
    }
    setFilterSql(sql1);
  };

  const onChangeSqlPromptInt = (value) => {
    setPromptIntBounce(value);
  };

  const onChangeSqlFilter = (value) => {
    setFilterSqlBounce(value);
  };

  const onChangeSqlPrompt = (value) => {
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
            {
              <EditorElemForFeatureGroup
                lang={'plaintext'}
                backTrasnparent
                hideExpandFull
                onlyThisFeatureGroup
                projectId={projectId}
                featureGroupId={featureGroupId}
                /*showSmallHelp sample={'sample to be defined 123'}*/ height={hh1}
                value={promptBounce}
                onChange={onChangeSqlPrompt}
              />
            }
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
            >
              <div>(Press Ctrl+Space to autocomplete name of columns)</div>
            </div>
            <div>
              <Button disabled={promptProcessing === true || _.trim(promptBounce || '') === ''} type={'primary'} style={{ width: '100%' }} onClick={onClickUsePrompt}>
                <span>Generate SQL</span>
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
            {
              <EditorElemForFeatureGroup
                lang={'plaintext'}
                backTrasnparent
                hideExpandFull
                onlyThisFeatureGroup
                projectId={projectId}
                featureGroupId={featureGroupId}
                /*showSmallHelp sample={'sample to be defined 123'}*/ height={hh1}
                value={promptIntBounce}
                onChange={onChangeSqlPromptInt}
              />
            }
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
            >
              <div>(Press Ctrl+Space to autocomplete name of columns)</div>
            </div>
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
            <span>{'Generated SQL'.toUpperCase()}</span>
            {_.trim(filterSqlBounce || '') !== '' && (
              <span
                css={`
                  margin-left: 10px;
                `}
                onClick={onClickClearSQL}
              >
                <TooltipExt title={'Clear SQL'}>
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
            {!props.isFeatureGroup && (
              <EditorElemForDataset
                hideErrors
                backTrasnparent
                hideExpandFull={false}
                projectId={projectId}
                datasetId={props.datasetId}
                /*showSmallHelp sample={'select * from fg (use "fg" as "this feature group")'}*/ height={hh1}
                value={filterSqlBounce}
                onChange={onChangeSqlFilter}
              />
            )}
            {props.isFeatureGroup && (
              <EditorElemForFeatureGroup
                hideErrors
                backTrasnparent
                hideExpandFull={false}
                onlyThisFeatureGroup
                projectId={projectId}
                featureGroupId={featureGroupId}
                /*showSmallHelp sample={'select * from fg (use "fg" as "this feature group")'}*/ height={hh1}
                value={filterSqlBounce}
                onChange={onChangeSqlFilter}
              />
            )}
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
            >
              <div>Example: select * from fg (use "fg" as "this feature group")</div>
              <div>(Press Ctrl+Space to autocomplete name of columns)</div>
            </div>
            <div>{/*<Button disabled={_.trim(filterSqlBounce || '')===''} type={'primary'} style={{ width: '100%', }} onClick={onClickUseFilterSqlRun}>Use</Button>*/}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PromptAdv;
