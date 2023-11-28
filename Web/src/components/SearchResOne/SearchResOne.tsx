import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LinearProgress from '@mui/material/LinearProgress';
import Popconfirm from 'antd/lib/popconfirm';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import Utils from '../../../core/Utils';
import UtilsTS from '../../UtilsTS';
import { DatasetLifecycle } from '../../stores/reducers/datasets';
import { DeploymentLifecycle } from '../../stores/reducers/deployments';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import Link from '../Link/Link';
import RectShow from '../RectShow/RectShow';
import { ISearchInOne, ISearchResOne } from '../SearchAll/ISearchResOne';
import TextMax from '../TextMax/TextMax';
const s = require('./SearchResOne.module.css');
const sd = require('../antdUseDark.module.css');

interface ISearchResOneProps {
  data?: ISearchResOne;
  searchInList?: ISearchInOne[];
  indent?: number;
  onClickDetail?: (r1?: ISearchResOne) => void;
  noDetails?: boolean;
  filterText?: string;
  onClickLink?: (e?) => void;
  maxTextLen?: number;
}

const SearchResOne = React.memo((props: PropsWithChildren<ISearchResOneProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const onClickVoid = (e) => {
    e.stopPropagation();
  };

  const onClickDetail = (key1, r1: ISearchResOne, e) => {
    e.stopPropagation();
    e.preventDefault();

    let d1 = r1.detail?.[key1];
    if (d1 != null && _.isFunction(d1)) {
      let res1 = (d1 as any)();
      if (res1 === true) {
        props.onClickLink?.(null);
      }
      return;
    }

    r1.detailIsOpen = r1.detailIsOpen ?? {};
    if (key1) {
      r1.detailIsOpen[key1] = !r1.detailIsOpen[key1];
      if (r1.detailIsOpen[key1] === true) {
        Object.keys(r1.detailIsOpen).some((k1) => {
          if (k1 !== key1) {
            r1.detailIsOpen[k1] = false;
          }
        });
      }
      forceUpdate();
    }

    props.onClickDetail?.(r1);
  };

  const render1 = useMemo(() => {
    let r1 = props.data;
    if (!r1) {
      return null;
    }

    if (r1.isSeparator) {
      return (
        <div
          css={`
            background: rgba(255, 255, 255, 0.2);
            height: 3px;
          `}
        ></div>
      );
    }

    let type1 = null;
    let in1 = props.searchInList?.find((s1) => s1.id === r1.type);
    if (in1) {
      type1 = <RectShow color={in1.color}>{in1.nameSingular}</RectShow>;
    }

    const calcProgressBarStatus = (status1) => {
      if (
        [
          DeploymentLifecycle.DEPLOYING,
          DeploymentLifecycle.DELETING,
          DeploymentLifecycle.PENDING,
          DeploymentLifecycle.STOPPING,
          DatasetLifecycle.CONVERTING,
          DatasetLifecycle.IMPORTING,
          DatasetLifecycle.PENDING,
          DatasetLifecycle.UPLOADING,
        ].includes(status1)
      ) {
        return <LinearProgress style={{ backgroundColor: 'transparent', height: '4px', borderRadius: '3px' }} />;
      }
    };

    let res1 = (
      <div
        css={`
          display: flex;
          padding: 7px 20px 9px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          &:hover {
            background: rgba(255, 255, 255, 0.12);
          }
        `}
      >
        <div
          css={`
            margin-right: 8px;
          `}
        >
          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faSearch').faSearch} transform={{ size: 14, x: 0, y: 0 }} />
        </div>
        {type1 != null && (
          <div
            css={`
              margin-right: 10px;
            `}
          >
            {type1}
          </div>
        )}

        {r1.id != null && (
          <div
            css={`
              margin-right: 10px;
              white-space: nowrap;
            `}
          >
            <RectShow color={'#c7ba8c'}>{r1.id}</RectShow>
            <CopyText noText>{r1.id}</CopyText>
          </div>
        )}
        <div
          css={`
            margin-right: 10px;
          `}
        >
          <TextMax max={props.maxTextLen ?? 90}>{UtilsTS.highlightIsTextInside(r1.name, props.filterText)}</TextMax>
        </div>

        {r1.status != null && (
          <div
            css={`
              margin-right: 10px;
            `}
          >
            -
          </div>
        )}
        {r1.status != null && (
          <div
            css={`
              margin-right: 10px;
            `}
          >
            {Utils.upperFirst(r1.status === 'COMPLETE' ? 'Active' : r1.status)}
            {calcProgressBarStatus(r1.status)}
          </div>
        )}

        {r1.isThisProject === true && (
          <div
            css={`
              padding-top: 2px;
              margin-right: 10px;
              font-size: 12px;
              opacity: 0.7;
            `}
          >
            ({r1.type === 'projects' ? 'This Project' : 'In this Project'})
          </div>
        )}

        {r1.date != null && (
          <div
            css={`
              margin-right: 10px;
              opacity: 0.7;
              font-size: 12px;
              padding-top: 2px;
            `}
          >
            (<DateOld always date={r1.date} />)
          </div>
        )}
        {r1.dateUnix != null && r1.date == null && (
          <div
            css={`
              margin-right: 10px;
              opacity: 0.7;
              font-size: 12px;
              padding-top: 2px;
            `}
          >
            (<DateOld always unix={r1.dateUnix} />)
          </div>
        )}

        <div
          css={`
            flex: 1;
          `}
        ></div>

        {!props.noDetails &&
          r1.detail != null &&
          Object.keys(r1.detail).map((k1, k1ind) => {
            let d1 = r1.detail[k1];
            let isFunction = _.isFunction(d1);

            let isFunctionAsk = isFunction && _.startsWith(k1, '_');
            let name1 = k1;
            if (isFunctionAsk) {
              name1 = name1.substring(1);
            }

            let res = (
              <div
                key={'det' + k1}
                css={`
                  margin-left: 5px;
                `}
                onClick={isFunctionAsk ? onClickVoid : onClickDetail.bind(null, k1, r1)}
              >
                <RectShow color={'#d7aa32'} doHover>
                  {/*// @ts-ignore*/}
                  {(isHover) => (
                    <>
                      {name1 ?? 'Detail'}
                      <span
                        css={`
                          margin-left: 4px;
                          width: 10px;
                          text-align: center;
                          display: inline-block;
                        `}
                      >
                        {isFunction && (
                          <FontAwesomeIcon icon={isHover ? require('@fortawesome/pro-solid-svg-icons/faLightbulb').faLightbulb : require('@fortawesome/pro-regular-svg-icons/faLightbulb').faLightbulb} transform={{ size: 14, x: 0, y: 0 }} />
                        )}
                        {!isFunction && r1.detailIsOpen?.[k1] && <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faChevronDown').faChevronDown} transform={{ size: 14, x: 0, y: 0 }} />}
                        {!isFunction && !r1.detailIsOpen?.[k1] && <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faChevronRight').faChevronRight} transform={{ size: 14, x: 0, y: 0 }} />}
                      </span>
                    </>
                  )}
                </RectShow>
              </div>
            );

            if (isFunctionAsk) {
              let popupContainerForMenu = (node) => document.getElementById('body2');
              res = (
                <Popconfirm key={'conf' + k1} title="Are you sure?" getPopupContainer={popupContainerForMenu} onCancel={onClickVoid} onConfirm={onClickDetail.bind(null, k1, r1)} okText="Yes" cancelText="No">
                  {res}
                </Popconfirm>
              );
            }

            return res;
          })}
      </div>
    );

    let link1 = r1.link;
    if (_.isFunction(link1)) {
      const onClickTop = (e) => {
        let res1 = (link1 as any)();
        props.onClickLink?.(e);
      };

      res1 = <Link onClick={onClickTop}>{res1}</Link>;
    } else if (link1 != null) {
      const onClickTop = (e) => {
        props.onClickLink?.(e);
      };
      res1 = (
        <Link onClick={onClickTop} newWindow={r1.newWindow} to={link1}>
          {res1}
        </Link>
      );
    }

    let openKey1 = Object.keys(r1.detailIsOpen ?? {}).find((k1) => r1.detailIsOpen?.[k1] === true);
    if (openKey1 != null) {
      let res2 = <div css={``}>{r1.detail?.[openKey1]}</div>;

      return (
        <>
          {res1}
          {res2}
        </>
      );
    } else {
      return res1;
    }
  }, [props.data, props.searchInList, ignored]);

  if (props.indent != null) {
    return (
      <div
        css={`
          margin-left: ${props.indent * 10}px;
        `}
      >
        {render1}
      </div>
    );
  } else {
    return render1;
  }
});

export default SearchResOne;
