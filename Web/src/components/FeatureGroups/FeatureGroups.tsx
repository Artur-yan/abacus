import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import React, { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import Location from '../../../core/Location';
import { calcImgSrc } from '../../../core/Utils';
import Constants from '../../constants/Constants';
import { memProjectById } from '../../stores/reducers/projects';
import FeatureGroupsList from '../FeatureGroupsList/FeatureGroupsList';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import { useAppSelector } from '../../../core/hooks';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TooltipExt from '../TooltipExt/TooltipExt';

import featureGroups from '../../stores/reducers/featureGroups';
import { FGLangType } from './FGLangType';

import Input from 'antd/lib/input';
import { useTemplateList } from '../../api/REUses';
import DropdownExt from '../DropdownExt/DropdownExt';
import TagsCloud from '../TagsCloud/TagsCloud';
import { TagOption } from '../TagsCloud/types';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
import REClient_ from '../../api/REClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SetRequiredFeatureGroupTypes from '../SetRequiredFeatureGroupTypes/SetRequiredFeatureGroupTypes';
import { faCaretRight } from '@fortawesome/pro-solid-svg-icons/faCaretRight';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons/faCaretDown';
import styles from './FeatureGroups.module.css';
import globalStyles from '../antdUseDark.module.css';

const errorCollapseHeight = 30;

interface IFeatureGroupsProps {}

const FeatureGroups = React.memo((props: PropsWithChildren<IFeatureGroupsProps>) => {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const featureGroupsParam = useAppSelector((state) => state.featureGroups);
  const projectsParam = useAppSelector((state) => state.projects);

  const [windowWidth, setWindowWidth] = useState(false);
  const [filteredTag, setFilteredTag] = useState<TagOption | null>(null);
  const [tagsCloudHeight, setTagsCloudHeight] = useState(0);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const tagCloud = useRef();
  const [filterText, setFilterText] = useState('');
  const [openRequiredFGTypes, setOpenRequiredFGTypes] = useState(false);

  useEffect(() => {
    onTagsCloudResize(tagCloud);
  }, [tagCloud.current, windowWidth]);

  const onTagsCloudResize = (tagCloud) => {
    tagCloud?.current && setTagsCloudHeight(tagCloud?.current?.clientHeight + 16);
  };

  useEffect(() => {
    if (projectId) {
      REClient_.client_()._validateProjectFeatureGroups(projectId, (err, res) => {
        if (err || !res?.success) {
          setErrorMessage(null);
        } else {
          if (!res?.result?.valid && res?.result?.datasetErrors?.length) {
            const errorMessage = res?.result?.datasetErrors?.reduce((acc, cur) => (cur.message ? `${acc === '' ? acc : acc + '\n'}${cur.message}` : acc), '');
            setErrorMessage(errorMessage);
          } else {
            setErrorMessage(null);
          }
        }
      });
    }
  }, [projectId]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const onClickAddFeatureStore = (type: FGLangType, e) => {
    let isTemplate = type === FGLangType.Template;
    if (isTemplate) {
      Location.push('/' + PartsLink.feature_groups_template_add + '/' + projectId, undefined, 'isAttach=1');
    } else {
      if (type === FGLangType.Python) {
        Location.push('/' + PartsLink.feature_groups_add + '/' + projectId, undefined, 'fromFeatureGroupList=1&useType=' + encodeURIComponent(type));
      } else {
        Location.push('/' + PartsLink.feature_groups_add + '/' + projectId, undefined, 'useType=' + encodeURIComponent(type));
      }
    }
  };

  const templateList = useTemplateList();

  const menuAddFG = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');
    const onClickVoid = (event) => {
      if (event && event.domEvent) {
        event.domEvent.stopPropagation();
      }
    };

    const templateTitle = 'Template Feature Group';

    let templateElem = null;
    return (
      <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
        <Menu.Item key={'sql'} onClick={onClickAddFeatureStore.bind(null, FGLangType.SQL)}>
          SQL Feature Group
        </Menu.Item>
        <Menu.Item key={'python'} onClick={onClickAddFeatureStore.bind(null, FGLangType.Python)}>
          Python Feature Group
        </Menu.Item>
        {Constants.flags.templates && templateElem}
      </Menu>
    );
  }, [templateList]);

  useEffect(() => {
    featureGroups.memFeatureGroupTypes(true);
  }, [featureGroupsParam]);

  const handleTagSelect = (tag: TagOption | null) => {
    setFilteredTag(tag);
  };

  const featuresGroupsListNoSort = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const featuresGroupsTags = useMemo(() => {
    let tagListForTagsCloud = [];
    let tagList = [];
    let filteredTags = [];

    featuresGroupsListNoSort?.forEach((list) => {
      if (list?.tags && list?.tags?.length > 0) {
        tagList = [...tagList, ...list.tags];
      }
    });

    tagList?.forEach((tagName) => {
      const lowerCasedTagname = tagName.toLowerCase();
      if (!filteredTags?.includes(lowerCasedTagname)) {
        filteredTags.push(lowerCasedTagname);
        tagListForTagsCloud.push({ value: tagName, count: 1 });
        return;
      }

      tagListForTagsCloud?.map((j) => {
        if (j?.value.toLowerCase() === lowerCasedTagname) {
          j.count++;
        }
      });
    });

    return tagListForTagsCloud?.slice(0, 100);
  }, [featuresGroupsListNoSort]);

  const onChangeFilterText = (e) => {
    setFilterText(e.target.value ?? '');
  };

  const onChangeHeightSize = (width) => {
    setWindowWidth(width);
  };

  const errorMessageHeight = useMemo(() => {
    if (!errorMessage) return 0;

    if (!showError) return errorCollapseHeight;

    const lineCharLen = 200;
    const errorLines = errorMessage?.split('\n') ?? [];
    const lineLen = errorLines.reduce((acc, cur) => {
      if (cur === '') {
        return acc + 1;
      }
      const wrapCount = Math.ceil(cur.length / lineCharLen);
      return acc + wrapCount;
    }, 0);

    return errorCollapseHeight + 20 + lineLen * 14;
  }, [errorMessage, showError]);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        margin: 10px 30px;
      `}
    >
      <RefreshAndProgress isRefreshing={false}>
        {errorMessage && (
          <div>
            <Button
              size={'small'}
              type={'default'}
              ghost
              css={`
                opacity: 0.56;
                font-size: 12px;
                line-height: 1;
              `}
              onClick={() => {
                setShowError((prev) => !prev);
              }}
            >
              Project Feature Group Error
              <FontAwesomeIcon
                css={`
                  margin-left: 4px;
                `}
                icon={showError ? faCaretRight : faCaretDown}
                transform={{ size: 15, x: 0, y: 0 }}
              />
            </Button>
            {showError && <div className={styles.errorMessage}>{errorMessage}</div>}
          </div>
        )}
        <div
          className={globalStyles.titleTopHeaderAfter}
          style={{ height: topAfterHeaderHH }}
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <div>
            Feature Groups
            <HelpIcon id={'featuregroups_title_main'} style={{ marginLeft: '4px' }} />
          </div>
          {Constants.flags.show_fg_explorer && (
            <div>
              <Link to={'/' + PartsLink.feature_groups_explorer + '/' + projectId}>
                <TooltipExt title={'Explore'}>
                  <Button
                    css={`
                      margin-left: 10px;
                      padding-left: 7px;
                      padding-right: 7px;
                    `}
                    type={'primary'}
                  >
                    <img
                      src={calcImgSrc('/imgs/explore.png')}
                      css={`
                        width: 18px;
                      `}
                      alt={''}
                    />
                  </Button>
                </TooltipExt>
              </Link>
            </div>
          )}

          <span
            css={`
              margin-left: 20px;
              font-size: 14px;
            `}
          >
            Search
          </span>
          <span
            css={`
              margin-left: 5px;
              width: 160px;
              font-size: 13px;
              @media screen and (max-width: 1420px) {
                width: 90px;
              }
            `}
          >
            <Input value={filterText} onChange={onChangeFilterText} allowClear />
          </span>

          <div
            css={`
              flex: 1;
            `}
          ></div>
          <div>
            <Button
              css={`
                margin-left: 7px;
                padding: 0 7px;
                @media screen and (max-width: 1420px) {
                  & .name2 {
                    display: none;
                  }
                }
              `}
              type={'primary'}
              onClick={(e) => {
                setOpenRequiredFGTypes(true);
              }}
            >
              Set
              <span
                css={`
                  margin-left: 5px;
                `}
                className={'name2'}
              >
                Feature Group
              </span>
              <span
                css={`
                  margin-left: 5px;
                `}
              >
                Types
              </span>
            </Button>
            <Link to={foundProject1?.useCase == null ? null : ['/' + PartsLink.feature_group_attach + '/' + projectId, 'useCase=' + encodeURIComponent(foundProject1?.useCase ?? '')]}>
              <Button
                css={`
                  margin-left: 7px;
                  padding: 0 7px;
                  @media screen and (max-width: 1420px) {
                    & .name2 {
                      display: none;
                    }
                  }
                `}
                type={'primary'}
              >
                Attach
                <span
                  css={`
                    margin-left: 5px;
                  `}
                  className={'name2'}
                >
                  Feature Group
                </span>
              </Button>
            </Link>
            <DropdownExt overlay={menuAddFG} trigger={['click']} placement={'bottomRight'}>
              <Button
                css={`
                  margin-left: 7px;
                  padding: 0 7px;
                  @media screen and (max-width: 1420px) {
                    & .name2 {
                      display: none;
                    }
                  }
                `}
                type={'primary'}
              >
                Add
                <span
                  css={`
                    margin-left: 5px;
                  `}
                  className={'name2'}
                >
                  Feature Group
                </span>
              </Button>
            </DropdownExt>
          </div>
        </div>

        <WindowSizeSmart onChangeSizeBoth={onChangeHeightSize} />

        <TagsCloud tags={featuresGroupsTags} containerRef={tagCloud} selectedTag={filteredTag} onTagSelect={handleTagSelect} />
        <div
          css={`
            position: absolute;
            top: ${topAfterHeaderHH + tagsCloudHeight + errorMessageHeight}px;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          <AutoSizer disableWidth>
            {({ height }) => {
              return <FeatureGroupsList filterText={filterText} height={height} filterByTag={filteredTag} />;
            }}
          </AutoSizer>
        </div>
      </RefreshAndProgress>
      <SetRequiredFeatureGroupTypes projectId={projectId} projectOne={foundProject1} featureGroupList={featuresGroupsListNoSort} isModalOpen={openRequiredFGTypes} setIsModalOpen={setOpenRequiredFGTypes} />
    </div>
  );
});

export default FeatureGroups;
