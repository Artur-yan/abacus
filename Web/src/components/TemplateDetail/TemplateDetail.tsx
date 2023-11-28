import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useTemplate, useTemplateList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { convertBEToConfig } from '../../stores/reducers/templates';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import LinkFG from '../LinkFG/LinkFG';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TemplateConfigEditor from '../TemplateConfigEditor/TemplateConfigEditor';
const s = require('./TemplateDetail.module.css');
const sd = require('../antdUseDark.module.css');

interface ITemplateDetailProps {}

const TemplateDetail = React.memo((props: PropsWithChildren<ITemplateDetailProps>) => {
  const { featureGroupsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  let featureGroupTemplateId = paramsProp?.get('featureGroupTemplateId');
  if (featureGroupTemplateId === '' || featureGroupTemplateId === '-') {
    featureGroupTemplateId = null;
  }

  const templateOne = useTemplate(featureGroupTemplateId);
  const templateList = useTemplateList();
  const isSystemTemplate = templateOne?.isSystemTemplate === true;

  const optionsTemplates = useMemo(() => {
    let res = templateList?.map((t1, t1ind) => ({ label: t1.name, value: t1.featureGroupTemplateId, data: t1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [templateList]);

  const onChangeSelectURLDirectFromValue = (option1) => {
    Location.push('/' + PartsLink.template_detail + '/' + option1?.value);
  };

  const onClickDeleteTemplate = (e) => {
    REClient_.client_().deleteFeatureGroupTemplate(featureGroupTemplateId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.describeTemplate_(featureGroupTemplateId);

        Location.push('/' + PartsLink.templates_list);
      }
    });
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const dataList = useMemo(() => {
    return [
      {
        id: 111,
        name: 'Template ID: ',
        value: <CopyText>{featureGroupTemplateId}</CopyText>,
        marginVert: null,
        valueColor: null,
      },
      {
        id: 2,
        name: 'Feature Group Source: ',
        value: (
          <LinkFG featureGroupId={templateOne?.featureGroupId} showTablenameAsText>
            {templateOne?.featureGroupId}
          </LinkFG>
        ),
      },
      {
        id: 4,
        name: 'Description: ',
        value: <span>{templateOne?.description}</span>,
        hidden: Utils.isNullOrEmpty(templateOne?.description),
      },
      {
        id: 3,
        name: 'Template Type: ',
        value: <span>{templateOne?.isSystemTemplate !== true ? 'User' : 'System'}</span>,
        hidden: Constants.flags.hide_system_templates,
      },
    ].filter((v1) => !v1?.hidden);
  }, [featureGroupTemplateId, templateOne]);

  const createdAt = templateOne?.createdAt;
  const createdBy = templateOne?.createdBy;

  const configTemplateCalc = useMemo(() => {
    return convertBEToConfig(templateOne?.templateVariables);
  }, [templateOne]);

  const calcLinkEditFG = (featureGroupId, isEditTemplate) => {
    return ['/' + PartsLink.feature_groups_edit + '/' + '-' + '/' + featureGroupId, 'useType=sql&useTemplateId=' + encodeURIComponent(featureGroupTemplateId) + (isEditTemplate ? '&fullEdit=1' : '')];
  };

  useEffect(() => {
    featureGroups.memFeatureGroupsForTemplateId(true, featureGroupTemplateId);
  }, [featureGroupsParam, featureGroupTemplateId]);
  const fgAttachedList = useMemo(() => {
    return featureGroups.memFeatureGroupsForTemplateId(false, featureGroupTemplateId);
  }, [featureGroupsParam, featureGroupTemplateId]);

  const fgAttachedColumns = useMemo(() => {
    return (
      [
        {
          title: 'Created At',
          field: 'createdAt',
          render: (text, row, index) => {
            return text == null ? '-' : <DateOld always date={text} />;
          },
        },
        {
          title: 'Feature Group ID',
          field: 'featureGroupId',
          isLinked: true,
          render: (text, row, index) => {
            return <CopyText>{text}</CopyText>;
          },
        },
        {
          title: 'Name',
          field: 'tableName',
          render: (text, row, index) => {
            return text;
          },
        },
      ] as ITableExtColumn[]
    ).filter((v1) => !v1.hidden);
  }, []);

  const calcKey = useCallback((row) => {
    return row.featureGroupId;
  }, []);

  const calcLink = useCallback((row) => {
    return '/' + PartsLink.feature_group_detail + '/-/' + row.featureGroupId;
  }, []);

  const onClickCreateFG = (e) => {
    let projectId = null;
    Location.push('/' + PartsLink.feature_groups_template_add + '/' + (projectId ?? '-'), undefined, 'isAttach=1&useTemplateId=' + encodeURIComponent(featureGroupTemplateId));
  };

  return (
    <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
      <NanoScroller onlyVertical>
        <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          {!isSystemTemplate && (
            <div style={{ float: 'right', marginRight: '20px' }}>
              <ModalConfirm
                onConfirm={onClickDeleteTemplate}
                title={`Do you want to remove the template '${templateOne?.name}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger ghost style={{ height: '30px', padding: '0 16px', marginRight: '20px', borderColor: 'transparent' }}>
                  Delete
                </Button>
              </ModalConfirm>
            </div>
          )}

          <span>{'Template Detail'}</span>
          <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsTemplates?.find((t1) => t1.value === featureGroupTemplateId)} options={optionsTemplates} onChange={onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
          </span>
        </div>

        <div style={{ display: 'flex' }} className={sd.backdetail}>
          <div style={{ marginRight: '24px' }}>
            <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
          </div>
          <div style={{ flex: 1, fontSize: '14px', fontFamily: 'Roboto', color: '#8798ad' }}>
            <div style={{ marginBottom: '10px' }}>
              <DetailHeader>{templateOne?.name}</DetailHeader>
              {/*{<TooltipExt title={'Rename'}>*/}
              {/*  <span css={`font-size: 14px; cursor: pointer; margin-left: 12px; opacity: 0.8; &:hover { opacity: 1; }`} onClick={this.onClickRenameModel.bind(this, modelId, nameDetail || '')}>*/}
              {/*    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 20, x: 0, y: -3, }} style={{ color: '#d1e4f5', marginRight: '8px', }} />*/}
              {/*  </span>*/}
              {/*</TooltipExt>}*/}
            </div>
            {dataList.map((d1) => (
              <div key={'val_' + d1.id} style={{ margin: (d1.marginVert ?? 5) + 'px 0' }}>
                <span>
                  <DetailName>{d1.name}</DetailName>
                  <DetailValue style={{ color: d1.valueColor ?? '#ffffff' }}>{d1.value}</DetailValue>
                </span>
              </div>
            ))}

            {/*{<div css={`font-size: 18px; margin-top: 15px; font-family: Matter, sans-serif; font-weight: 500; line-height: 1.6;`}>*/}
            {/*&nbsp;-&nbsp;*/}
            {/*<span css={`margin: 5px;`}>*/}
            {/*<Link to={'/'+PartsLink.monitor_data_integrity+'/'+modelId+'/'+projectId}>*/}
            {/*  <span className={sd.styleTextBlueBrightColor}>Integrity</span>*/}
            {/*</Link>*/}
            {/*</span>*/}
            {/*</div>}*/}
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '10px' }}>
            {createdAt != null && (
              <div>
                <DetailCreatedAt>Created At: {<DateOld always date={createdAt} />}</DetailCreatedAt>
              </div>
            )}
            {createdBy != null && (
              <div>
                <DetailCreatedAt>Created By: {createdBy}</DetailCreatedAt>
              </div>
            )}
            {!isSystemTemplate && (
              <Link to={['/' + PartsLink.template_one + '/' + featureGroupTemplateId, 'isEdit=1&fullEdit=1']}>
                <Button
                  css={`
                    margin-top: 10px;
                  `}
                  type={'primary'}
                >
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div
          css={`
            margin-top: 25px;
            margin-left: 15px;
          `}
        >
          <Button onClick={onClickCreateFG} type={'primary'}>
            Create Feature Group from Template
          </Button>
        </div>

        <div
          css={`
            margin: 30px 0;
            position: relative;
            height: 400px;
            border-radius: 10px;
          `}
          className={sd.grayPanel}
        >
          <FormExt
            layout={'vertical'}
            className={sd.absolute}
            css={`
              margin: 15px;
            `}
          >
            {
              /*// @ts-ignore */
              <SplitPane
                split={'vertical'}
                minSize={230}
                defaultSize={Utils.dataNum('expandsql_template_config_detail', 520)}
                onChange={(v1) => {
                  Utils.dataNum('expandsql_template_config_detail', undefined, v1);
                }}
              >
                <div key={'e1'}>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        {'Config'}:<HelpIcon id={'template_detail_config'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  ></Form.Item>
                  <div
                    css={`
                      margin-right: 10px;
                      position: relative;
                      height: ${400 - 30 - 3}px;
                    `}
                  >
                    <TemplateConfigEditor hideEdit config={configTemplateCalc} readonly={true} />
                  </div>
                </div>
                <div key={'e2'}>
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        {'Sql Template'}:<HelpIcon id={'template_detail_sql_template'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <EditorElemForFeatureGroup readSure readonly={true} height={400 - 30 - 90} value={templateOne?.templateSql ?? ''} />
                  </Form.Item>
                </div>
              </SplitPane>
            }
          </FormExt>
        </div>

        {
          <div style={{ margin: '30px 0' }}>
            <div className={sd.titleTopHeaderAfter} style={{ marginBottom: '14px' }}>
              Feature Groups attached with this Template
              <HelpIcon id={'fgs_using_template'} style={{ marginLeft: '4px' }} />
            </div>
            <TableExt isDetailTheme showEmptyIcon defaultSort={{ field: 'createdAt', isAsc: false }} dataSource={fgAttachedList} columns={fgAttachedColumns} calcKey={calcKey} calcLink={calcLink} />
          </div>
        }
      </NanoScroller>
    </div>
  );
});

export default TemplateDetail;
