import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Constants from '../../constants/Constants';

import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Menu from 'antd/lib/menu';
import * as moment from 'moment';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups, { FeatureGroupVersionLifecycle } from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import { FGLangType, calcLangType } from '../FeatureGroups/FGLangType';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';

import UtilsTS from '../../UtilsTS';
import DropdownExt from '../DropdownExt/DropdownExt';
import { TagOption } from '../TagsCloud/types';
import TooltipExt from '../TooltipExt/TooltipExt';
import globalStyles from '../antdUseDark.module.css';

interface IFeatureGroupsListProps {
  height?: number;
  showTitle?: boolean;
  filterByTag?: TagOption;
  onTagSelect?: (tag) => void;
  filterText?: string;
}

const FeatureGroupsList = React.memo(({ filterByTag, onTagSelect, ...props }: PropsWithChildren<IFeatureGroupsListProps>) => {
  const { projectsParam, paramsProp, useCasesParam, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
    useCasesParam: state.useCases,
  }));

  const projectId = paramsProp?.get('projectId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const featuresGroupsListNoSort = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const handleFilterGroupListByTag = (list, selectedTag: TagOption) => {
    const filteredList = selectedTag?.value ? list.filter((feature) => feature?.tags?.includes(selectedTag.value)) : [];
    return filteredList;
  };

  const featuresGroupsList = useMemo(() => {
    let featuresGroupsListFilteredByTags = featuresGroupsListNoSort;

    if (filterByTag && featuresGroupsListNoSort) {
      featuresGroupsListFilteredByTags = handleFilterGroupListByTag(featuresGroupsListNoSort, filterByTag);
    }

    let res = featuresGroupsListFilteredByTags?.sort((a, b) => {
      let res = 0;
      if (a.starred && !b.starred) {
        res = -1;
      } else if (!a.starred && b.starred) {
        res = 1;
      }
      if (res === 0) {
        let ma = a.attachedAt ?? a.updatedAt;
        let mb = b.attachedAt ?? b.updatedAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    if (!Utils.isNullOrEmpty(props.filterText)) {
      res = res?.filter((r1) => Utils.searchIsTextInside(r1.tableName?.toLowerCase(), props.filterText?.toLowerCase()));
    }

    return res;
  }, [featuresGroupsListNoSort, filterByTag, props.filterText]);

  const schemaInfoUseCase = useMemo(() => {
    return memUseCasesSchemasInfo(false, foundProject1?.useCase);
  }, [useCasesParam, foundProject1?.useCase]);
  useEffect(() => {
    memUseCasesSchemasInfo(true, foundProject1?.useCase);
  }, [useCasesParam, foundProject1?.useCase]);

  const onClickFeaturesEditGo = (id, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    Location.push('/' + PartsLink.feature_groups_edit + '/' + projectId + '/' + id);
  };

  const onClickRemoveFeatures = (id, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    REClient_.client_().removeFeatureGroupFromProject(id, projectId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getProjectsById_(projectId);
        StoreActions.getProjectDatasets_(projectId, (res, ids) => {
          StoreActions.listDatasets_(ids);
        });
        StoreActions.featureGroupsGetByProject_(projectId);
      }
    });
  };

  const onClickExportsGo = (id, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    Location.push('/' + PartsLink.feature_groups_export + '/' + projectId + '/' + id);
  };

  const onClickFeaturesGo = (id, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    Location.push('/' + PartsLink.features_list + '/' + projectId + '/' + id);
  };

  const onClickStarred = (featureGroupId, starred, e) => {
    REClient_.client_()._starFeatureGroup(featureGroupId, starred, (err, res) => {
      StoreActions.featureGroupsGetByProject_(projectId);
      StoreActions.featureGroupsDescribe_(projectId, featureGroupId);

      StoreActions.featureGroupsDescribe_(null, featureGroupId, (res) => {
        let pIds = res?.projects?.map((p1) => p1?.projectId);
        if (pIds && pIds.length > 0) {
          pIds.some((id1) => {
            StoreActions.featureGroupsDescribe_(id1, featureGroupId);
          });
        }
      });
    });
  };

  const onClickCancelEvents = (e) => {
    e.stopPropagation();
  };

  const onClickUseForTraining = (featureGroupId, isChecked, e) => {
    REActions.addNotification('Processing...');
    REClient_.client_().useFeatureGroupForTraining(projectId, featureGroupId, isChecked === true, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.validateProjectDatasets_(projectId);
        StoreActions.featureGroupsGetByProject_(projectId, (list) => {
          list?.some((f1) => {
            StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
          });
        });
      }
    });
  };

  useEffect(() => {
    featureGroups.memFeatureGroupTypes(true);
  }, [featureGroupsParam]);

  const featuresGroupsColumns = useMemo(() => {
    let columns: ITableExtColumn[] = [
      {
        title: '',
        width: 40,
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan name={'Feature Group'} isStarred={starred} onClick={onClickStarred.bind(null, row.featureGroupId)} />;
        },
      },
      {
        title: 'Attached At',
        field: 'attachedAt',
        helpId: 'fglist_attachedat',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld date={text} />;
        },
        width: 180,
      },
      {
        title: 'Feature Group ID',
        field: 'featureGroupId',
        helpId: 'fglist_id',
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
        isLinked: true,
        width: 180,
      },
      {
        title: 'Table Name',
        field: 'tableName',
        helpId: 'fglist_tablename',
        isLinked: true,
        render: (text, row, index) => {
          if (Utils.isNullOrEmpty(props.filterText)) {
            let templateS = null;
            if (row.featureGroupSourceType?.toUpperCase() === 'TEMPLATE') {
              templateS = (
                <span
                  css={`
                    margin-left: 5px;
                    opacity: 0.7;
                  `}
                >
                  (Template {row?.featureGroupTemplate?.featureGroupTemplateId})
                </span>
              );
            }

            return (
              <span>
                {text}
                {templateS}
              </span>
            );
          } else {
            return UtilsTS.highlightIsTextInside(text, props.filterText, false, '#fff586');
          }
        },
      },
      {
        title: 'Status',
        field: 'latestFeatureGroupVersion',
        helpId: 'fg_detail_table_header_status_1',
        render: (text, row, index) => {
          var status = text?.status || 'Not materialized yet';
          if ([FeatureGroupVersionLifecycle.PENDING, FeatureGroupVersionLifecycle.GENERATING].includes(status)) {
            StoreActions.refreshDoFGVersionsAll_(projectId, row.featureGroupId, text?.featureGroupVersion);
          }
          let isUploading = text?.featureGroupVersion && StoreActions.refreshFGVersionsUntilStateIsUploading_(text?.featureGroupVersion);
          if (isUploading) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status ?? '')}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status)}</span>;
            if (FeatureGroupVersionLifecycle.FAILED === status) {
              res = (
                <div>
                  <span className={globalStyles.red}>{res}</span>
                  {text?.error ? (
                    <TooltipExt placement="bottom" overlay={<span style={{ whiteSpace: 'pre-wrap' }}>{text.error}</span>}>
                      <FontAwesomeIcon icon={['far', 'exclamation-circle']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, color: 'red', marginLeft: '6px' }} />
                    </TooltipExt>
                  ) : null}
                </div>
              );
            }
            return res;
          }
        },
        width: 160,
      },
      {
        title: 'Feature Group Type',
        field: 'datasetType',
        helpId: 'fglist_datasettype',
        hideLessSmall: true,
        width: 224,
        render: (text, row, index) => {
          if (Utils.isNullOrEmpty(text)) {
            return '';
          }

          if (text?.toUpperCase() === Constants.custom_table) {
            return <span>{Constants.custom_table_desc}</span>;
          }

          schemaInfoUseCase?.list?.some((s1) => {
            const uc1 = schemaInfoUseCase[s1];
            if (text?.toUpperCase() === uc1?.dataset_type?.toUpperCase()) {
              let title = uc1?.title;
              if (!Utils.isNullOrEmpty(title)) {
                text = title;
                return true;
              }
            }
          });

          return <span>{text ?? ''}</span>;
        },
      },
      {
        title: !foundProject1?.isFeatureStore ? 'Train' : '',
        field: 'useForTraining',
        helpId: 'fglist_usefortraining',
        render: (text, row, index) => {
          if (row.shouldEnableUseForTraining === false) {
            return null;
          }

          if (!foundProject1?.isFeatureStore) {
            let isChecked = ('' + text)?.toLowerCase() === 'true';
            let res = <Checkbox checked={isChecked} />;
            res = (
              <ModalConfirm
                onConfirm={onClickUseForTraining.bind(null, row.featureGroupId, !isChecked)}
                title={isChecked ? 'Do you want to clear the use for training?' : `Do you want to use this Feature Group for training?`}
                icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                okText={isChecked ? 'Clear' : 'Use For Training'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                {res}
              </ModalConfirm>
            );
            return (
              <div
                css={`
                  display: flex;
                  align-items: center;
                  padding-left: 20px;
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                `}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {res}
              </div>
            );
          } else {
            return null;
          }
        },
        width: 100,
        hidden: true,
      },
    ];

    columns.push({
      noAutoTooltip: true,
      noLink: true,
      title: 'actions',
      field: 'actions',
      helpId: 'fglist_actions',
      width: 130,
      render: (text, row) => {
        let popupContainerForMenu = (node) => document.getElementById('body2');
        let fgLang: FGLangType = calcLangType(row?.featureGroupSourceType);

        const menu = (
          <Menu getPopupContainer={popupContainerForMenu}>
            {(!Utils.isNullOrEmpty(row?.functionSourceCode) || !Utils.isNullOrEmpty(row?.sql)) && (
              <Menu.Item onClick={onClickFeaturesEditGo.bind(null, row.featureGroupId)}>Edit {[FGLangType.Python].includes(fgLang) ? 'Code' : 'SQL'}</Menu.Item>
            )}
            <Menu.Item onClick={onClickFeaturesGo.bind(null, row.featureGroupId)}>Features</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={onClickExportsGo.bind(null, row.featureGroupId)}>Exports</Menu.Item>
            <Menu.Divider />
            <Menu.Item>
              <ModalConfirm
                onConfirm={onClickRemoveFeatures.bind(null, row.featureGroupId)}
                title={`Do you want to detach this feature group "${row.tableName || ''}" from the project?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Remove'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Detach</div>
              </ModalConfirm>
            </Menu.Item>
          </Menu>
        );

        const styleButton: CSSProperties = { margin: '4px' };
        return (
          <span style={{ whiteSpace: 'normal' }}>
            {
              <DropdownExt overlay={menu} trigger={['click']}>
                <Button style={styleButton} ghost type={'default'} onClick={onClickCancelEvents}>
                  Actions
                </Button>
              </DropdownExt>
            }
          </span>
        );
      },
    });

    columns = columns?.filter((c1) => c1.hidden !== true);

    return columns;
  }, [schemaInfoUseCase, props.height, foundProject1, props.filterText]);

  const calcLink = (row) => {
    return '/' + PartsLink.feature_group_detail + '/' + projectId + '/' + row.featureGroupId;
  };

  return (
    <>
      {props.showTitle && (
        <div
          className={globalStyles.titleTopHeaderAfter}
          css={`
            margin-bottom: 20px;
            display: flex;
          `}
        >
          <span>
            Feature Groups
            <HelpIcon id={'featuregroupslist_title'} style={{ marginLeft: '4px' }} />
          </span>
        </div>
      )}
      <TableExt virtualFlexShrink={1} height={props.height} isVirtual={props.height != null} showEmptyIcon={true} dataSource={featuresGroupsList} columns={featuresGroupsColumns} calcKey={(r1) => r1.featureGroupId} calcLink={calcLink} />
    </>
  );
});

export default FeatureGroupsList;
