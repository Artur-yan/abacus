import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import $ from 'jquery';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Icon from 'react-icons-kit';
import { command } from 'react-icons-kit/iconic/command';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import SearchAll from '../SearchAll/SearchAll';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
const s = require('./NavTopSearch.module.css');
const sd = require('../antdUseDark.module.css');

interface INavTopSearchProps {
  hideInviteTeam?: any;
}

const NavTopSearch = React.memo((props: PropsWithChildren<INavTopSearchProps>) => {
  const { defDatasetsParam, projectDatasetsParam, featureGroupsParam, projectsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projectsParam: state.projects,
    projectDatasetsParam: state.projectDatasets,
    featureGroupsParam: state.featureGroups,
    defDatasetsParam: state.defDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isVisible, setIsVisible] = useState(false);
  const [posLeft, setPosLeft] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const refCircle = useRef<HTMLSpanElement>(null);

  // const [isValidate, setIsValidate] = useState(false);
  // const [isValidateRefreshing, setIsValidateRefreshing] = useState(false);

  // const [isValid, setIsValid] = useState(null);

  // const [isUserDropVisible, setIsUserDropVisible] = useState(false);

  // const onUserDropVisibleChange = (isVisible) => {
  //   setIsUserDropVisible(isVisible);
  // };

  // const userDropdownShowHide = (isVisible) => {
  //   onUserDropVisibleChange(isVisible);
  // };

  // useEffect(() => {
  //   let unUserDropShowHide = REActions.userDropdownShowHide.listen(userDropdownShowHide);
  //
  //   return () => {
  //     unUserDropShowHide();
  //   };
  // }, []);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  // useEffect(() => {
  //   memProjectById(projectId, true);
  // }, [projectsParam, projectId]);
  // const foundProject1 = useMemo(() => {
  //   return memProjectById(projectId, false);
  // }, [projectsParam, projectId]);

  // const isFeatureStore = foundProject1?.isFeatureStore===true;

  // useEffect(() => {
  //   defDatasets.memValidationForProjectId(true, projectId);
  // }, [projectId, defDatasetsParam]);
  // const validation = useMemo(() => {
  //   return defDatasets.memValidationForProjectId(false, projectId);
  // }, [projectId, defDatasetsParam]);

  useEffect(() => {
    setIsVisible(false);
  }, [paramsProp]);

  // const anyDatasetProcessing = useMemo(() => {
  //   if(foundProject1?.allProjectDatasets==null) {
  //     return null;
  //   }
  //
  //   let anyProcessing = false;
  //   foundProject1?.allProjectDatasets?.some(d1 => {
  //     let s1 = d1?.lastVersion?.status;
  //     if([DatasetLifecycle.PENDING, DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.INSPECTING].includes(s1)) {
  //       anyProcessing = true;
  //       return true;
  //     }
  //   });
  //   return anyProcessing;
  // }, [foundProject1]);

  // useEffect(() => {
  //   setIsValid(isV => {
  //     isV = validation?.valid;
  //     return isV;
  //   });
  // }, [validation]);

  const onClickBar = (isValidate, e) => {
    e?.stopPropagation();
    e?.preventDefault();

    // if(isValidate) {
    //   if(isValidateRefreshing) {
    //     return;
    //   }
    //
    //   setIsValidateRefreshing(true);
    //   StoreActions.validateProjectDatasets_(projectId, (data1) => {
    //     setIsValidateRefreshing(false);
    //
    //     if(data1?.valid===false) {
    //       setIsValidate(true);
    //       setIsVisible(true);
    //
    //     } else {
    //       REActions.addNotification('Valid!');
    //     }
    //   });
    //   return;
    // }

    // setIsValidate(isValidate);
    let e1 = $(refCircle.current);
    setPosLeft(e1.offset()?.left ?? 0);

    setIsVisible(true);
  };

  const onBarHide = () => {
    setIsVisible(false);
  };

  let isMac = useMemo(() => {
    return Utils.isMac();
  }, []);

  const onKeyStart = useCallback(
    (e) => {
      if (e.key === 'k') {
        if (e.ctrlKey || e.metaKey) {
          onClickBar(false, null);
        }
      }
    },
    [isMac],
  );

  useEffect(() => {
    $(document).on('keydown', null, onKeyStart);

    return () => {
      $(document).off('keydown', onKeyStart);
    };
  }, []);

  // let isLoggedInRes = calcAuthUserIsLoggedIn();
  // let isLoggedIn = isLoggedInRes?.isLoggedIn===true;
  // let showInvite = !!isLoggedIn && !!isLoggedInRes.alreadyOrgId && !isLoggedInRes.emailValidateNeeded && !props.hideInviteTeam;
  // const espRoot = 2;
  //
  // let userDrop = <UserDropdown />;
  // let popupContainerForMenu = (node) => (document.getElementById('body2'));

  const onMouseEnter = (e) => {
    setIsHover(true);
  };

  const onMouseLeave = (e) => {
    setIsHover(false);
  };

  let isHoverOrVisible = isHover || isVisible;

  const onChangeWinSize = useCallback(
    (ww) => {
      if (!isVisible) {
        return;
      }

      let e1 = $(refCircle.current);
      setPosLeft(e1.offset()?.left ?? 0);
    },
    [isVisible, refCircle],
  );

  return (
    <>
      <SearchAll posLeft={posLeft} isVisible={isVisible} isValidate={false /*isValidate*/} onHide={onBarHide} />
      <WindowSizeSmart onChangeSize={onChangeWinSize} />

      <span
        ref={refCircle}
        onClick={onClickBar.bind(null, false)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        css={`
          cursor: pointer;
          transition: all 400ms;
          color: white;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${false && isVisible ? '#3d4641' : '#315e56'};
          width: ${isHoverOrVisible ? 80 + (isMac ? -12 : 0) : 30}px;
          height: 30px;
        `}
      >
        <FontAwesomeIcon
          css={`
            margin-left: ${isHoverOrVisible ? 0 : 38 + (isMac ? 0 : 11)}px;
            transition: all 400ms;
          `}
          icon={require('@fortawesome/pro-regular-svg-icons/faSearch').faSearch}
          transform={{ size: 18, x: 0, y: 0 }}
        />

        {
          <div
            css={`
              opacity: ${isHoverOrVisible ? 1 : 0};
              transition: all 400ms;
              display: flex;
              align-items: center;
              font-size: 12px;
              margin-left: 10px;
            `}
          >
            {isMac && <Icon icon={command} size={12} />}
            {!isMac && (
              <span
                css={`
                  white-space: nowrap;
                  margin-right: 3px;
                `}
              >
                Ctrl
              </span>
            )}
            <span css={``}>+</span>
            <span
              css={`
                margin-left: 2px;
              `}
            >
              K
            </span>
          </div>
        }
      </span>
    </>
  );

  // return (
  //   <>
  //     <SearchAll isVisible={isVisible} isValidate={isValidate} onHide={onBarHide} />
  //
  //     <div css={`display: flex; justify-content: center; align-items: center; background: #000; height: ${Constants.navTopSearchHH}px;`}>
  //       <div css={`width: ${Constants.navWidthExtended}px;`}></div>
  //
  //       <div onClick={onClickBar.bind(null, false)} css={`position: relative; cursor: pointer; width: 600px; max-width: 50%; display: flex; justify-content: center; align-items: center; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); height: ${Constants.navTopSearchHH-2*7}px;`}>
  //         <span css={`color: rgba(255,255,255,0.6); font-size: 13px; position: relative;`}>
  //           <span css={`margin-right: 7px;`}>
  //             <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faSearch').faSearch} transform={{ size: 14, x: 0, y: 0, }} />
  //           </span>
  //           {`Search ${paramsProp?.get('projectId') ? 'in this project and ' : ''}everywhere`}
  //
  //           <span css={`margin-left: 10px; display: inline-flex; align-items: center;`}>
  //             {isMac && <Icon icon={command} size={12} />}
  //             {!isMac && <span css={`margin-right: 3px; padding-top: 1px;`}>Ctrl</span>}
  //             <span css={`padding-top: 1px;`}>+</span>
  //             <span css={`margin-left: 2px; padding-top: 1px;`}>K</span>
  //           </span>
  //         </span>
  //       </div>
  //       {projectId!=null && <TooltipExt title={'Click to Validate Again'} placement={'bottom'}>
  //         <div onClick={onClickBar.bind(null, true)} css={`font-size: 13px; display: flex; align-items: center; margin-left: 15px; top: 3px; white-space: nowrap; color: rgba(255,255,255,0.85);`}>
  //           <span css={`margin-right: 6px; position: relative;`}>
  //             {!anyDatasetProcessing && !isValidateRefreshing && isValid===true && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faShieldCheck').faShieldCheck} transform={{ size: 18, x: 0, y: 0.5, }} css={`color: green;`} swapOpacity />}
  //             {!anyDatasetProcessing && !isValidateRefreshing && isValid===false && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faShieldCheck').faShieldCheck} transform={{ size: 18, x: 0, y: 0.5, }} css={`color: red;`} swapOpacity />}
  //             {(isValidateRefreshing || anyDatasetProcessing) && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 14.5, x: 0, y: 0, }} css={``} spin />}
  //           </span>
  //           {/*<span css={``}>Errors State</span>*/}
  //         </div>
  //       </TooltipExt>}
  //
  //       <div css={`flex: 1;`}></div>
  //
  //       <div style={{ marginLeft: '10px', marginRight: '12px', height: (Constants.headerHeight()-3*espRoot)+'px', display: 'table', marginTop: '1px', }}>
  //         {Constants.flags.show_alerts && <span style={{ marginRight: '10px', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
  //           <AlertsIcon />
  //         </span>}
  //
  //         {showInvite && <span style={{ marginRight: '10px', display: 'inline-flex', height: '100%', alignItems: 'center', paddingBottom: '2px', opacity: 0.7 }}>
  //           <Link to={'/'+PartsLink.profile+'/'+UserProfileSection.invites}><Button style={{ borderColor: Utils.colorA(0.4), }} type={'default'} ghost>Invite Team</Button></Link>
  //         </span>}
  //
  //         {isLoggedIn && <Popover onVisibleChange={onUserDropVisibleChange} visible={isUserDropVisible} content={userDrop} title={'User'} trigger={'click'} getPopupContainer={popupContainerForMenu} placement={'bottomRight'}>
  //           <span style={{ display: 'table-cell', verticalAlign: 'middle', height: '100%', }}>
  //             <UserCardNav />
  //           </span>
  //         </Popover>}
  //       </div>
  //     </div>
  //   </>
  // );
});

export default NavTopSearch;
