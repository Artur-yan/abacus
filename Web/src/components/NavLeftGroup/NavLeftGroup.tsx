import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import { calcModeForBatchPred } from '../NavLeft/utils';
import PartsLink from '../NavLeft/PartsLink';
import NavLeftLine from '../NavLeftLine/NavLeftLine';
const s = require('./NavLeftGroup.module.css');
const sd = require('../antdUseDark.module.css');

interface INavLeftGroupProps {
  openParts?: PartsLink[];
  alwaysOpen?: boolean;
  saveOpenStateName?: string;
  firstDisabled?: boolean;
  hideChevron?: boolean;
  hideIfEmpty?: boolean;
  isSubGroup?: boolean;
}

const NavLeftGroup = React.memo((props: PropsWithChildren<INavLeftGroupProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isOpen, setIsOpen] = useState(false); //Utils.dataNum('navLeftGroup_'+props.saveOpenStateName, false));
  const [isOpenForParts, setIsOpenForParts] = useState(false);
  const saveRef = useRef(false); //Utils.dataNum('navLeftGroup_'+props.saveOpenStateName, false));

  let mode1 = paramsProp?.get('mode');
  let batchPredId = paramsProp?.get('batchPredId');

  useEffect(() => {
    let modePost = mode1;
    if (batchPredId) {
      modePost = calcModeForBatchPred(mode1);
    }

    if (props.openParts?.includes(modePost) || props.alwaysOpen) {
      setIsOpen(true);
      setIsOpenForParts(true);
    } else {
      if (saveRef.current === false) {
        setIsOpen(false);
      }
      setIsOpenForParts(false);
    }
  }, [props.openParts, mode1, saveRef, batchPredId]);

  const onChangeOpen = () => {
    setIsOpen((v1) => {
      saveRef.current = !v1;
      Utils.dataNum('navLeftGroup_' + props.saveOpenStateName, undefined, !v1);
      return !v1;
    });
  };

  const { first, childs } = useMemo(() => {
    let first, childs;

    if (props.children != null) {
      let cc = React.Children.toArray(props.children);
      cc = cc?.filter((v1) => v1 != null);
      if (cc.length > 0) {
        if (props.firstDisabled) {
          first = null;
          childs = cc;
        } else {
          first = cc[0];
          childs = cc.length > 1 ? cc.slice(1) : [];
        }

        if (first != null && Utils.isElement(first) && first.type === NavLeftLine) {
          let props1: any = props.hideChevron ? {} : { isOpen: isOpen, showChevron: true, onChangeOpen: onChangeOpen, chevronAllRow: props.isSubGroup === true };
          if (isOpenForParts) {
            props1.isFolderSelected = true;
          }
          if (props.hideChevron) {
            props1.indent = (first?.props?.indent ?? 0) + 2;
          }
          first = React.cloneElement(first, props1);
        }

        childs = childs?.map((c1) => {
          if (c1 != null && Utils.isElement(c1) && c1.type === NavLeftLine && first != null) {
            return React.cloneElement(c1, { indent: (first?.props?.indent ?? 0) + 3.2 + (props.hideChevron ? -2 : 0) });
          } else {
            return c1;
          }
        });
      }
    }

    return { first, childs };
  }, [props.children, isOpen, isOpenForParts, props.firstDisabled, props.hideChevron, props.isSubGroup]);

  const isEmpty = useMemo(() => {
    if (childs == null || childs.length === 0) {
      return true;
    } else {
      return false;
    }
  }, [childs]);

  //
  if (props.hideIfEmpty && isEmpty) {
    return null;
  }

  return (
    <div>
      {first}
      <div
        css={`
          display: ${isOpen ? 'block' : 'none'};
        `}
      >
        {childs}
      </div>
    </div>
  );
});

export default NavLeftGroup;
