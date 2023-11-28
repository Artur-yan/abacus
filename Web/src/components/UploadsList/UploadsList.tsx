import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REUploads_ from '../../api/REUploads';
import Constants from '../../constants/Constants';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import NanoScroller from '../NanoScroller/NanoScroller';
import UploadsFileOne from '../UploadsFileOne/UploadsFileOne';
const s = require('./UploadsList.module.css');
const sd = require('../antdUseDark.module.css');

interface IUploadsListProps {}

const UploadsList = React.memo((props: PropsWithChildren<IUploadsListProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isExpanded, setExpanded] = useState(Utils.dataNum('uploadsFileFloatPanelExpanded', { isExpanded: false })?.isExpanded ?? false);

  const setExpandedExt = (isExpanded) => {
    setExpanded(isExpanded);
    Utils.dataNum('uploadsFileFloatPanelExpanded', undefined, { isExpanded });
  };

  const uploadsRefresh = (uploadId?: string) => {
    forceUpdate();
  };

  useEffect(() => {
    const unDark = REActions.onDarkModeChanged.listen(uploadsRefresh);
    const unUploadRefresh = REActions.uploadsRefresh.listen(uploadsRefresh);

    return () => {
      unDark();
      unUploadRefresh();
    };
  }, []);

  let files = REUploads_.client_().getFilesList();
  let listFiles = useMemo(() => {
    if (files) {
      return files.map((f1) => <UploadsFileOne key={f1.id} file={f1} />);
    } else {
      return null;
    }
  }, [files]);
  let percentageTotal = useMemo(() => {
    if (files) {
      let total = 0,
        actual = 0;
      files.some((f1) => {
        actual += f1.actual ?? 0;
        total += f1.total ?? 0;
      });
      let res = total === 0 ? 0 : (100 / total) * actual;
      if (res > 100) {
        res = 100;
      }
      if (res < 0) {
        res = 0;
      }
      return res;
    } else {
      return null;
    }
  }, [files]);

  let hh = 204;
  const topHH = 44;
  if (!isExpanded) {
    hh = topHH;
  }

  const onClickExpand = () => {
    setExpandedExt(!isExpanded);
  };

  const count = listFiles?.length ?? 0;
  let percentageTotalS = null;
  if (percentageTotal != null) {
    percentageTotalS = <span style={{}}>{'' + Utils.decimals(percentageTotal, 2) + '%'}</span>;
  }

  let isLoggedInRes = calcAuthUserIsLoggedIn();
  let isLoggedIn = isLoggedInRes.isLoggedIn === true;

  return (
    <div
      style={{
        borderTopRightRadius: '6px',
        borderTopLeftRadius: '6px',
        fontFamily: 'Matter',
        fontSize: '15px',
        fontWeight: 600,
        display: count === 0 || !isLoggedIn ? 'none' : 'block',
        zIndex: 100,
        position: 'absolute',
        bottom: Constants.NavBottomHeight + 'px',
        right: '40px',
        height: hh + 'px',
        width: '400px',
        backgroundColor: '#242b34',
      }}
    >
      <div
        onClick={onClickExpand}
        style={{
          borderBottom: isExpanded ? '1px solid #8798ad' : '',
          borderTopRightRadius: '6px',
          borderTopLeftRadius: '6px',
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topHH + 'px',
          padding: '11px 16px',
          color: Utils.colorA(1),
        }}
      >
        <div style={{ float: 'right', padding: '0 6px', height: '100%', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={['far', isExpanded ? 'angle-down' : 'angle-up']} transform={{ size: 21, x: 0, y: 0 }} style={{}} />
        </div>
        <span style={{ color: 'white' }}>Uploads</span>&nbsp;&nbsp;(<span style={{ marginLeft: '1px' }}></span>
        {count}
        <span style={{ marginLeft: '1px' }}></span>)&nbsp;&nbsp;{percentageTotalS}
      </div>
      <div style={{ display: isExpanded ? 'block' : 'none', position: 'absolute', top: topHH + 'px', left: 0, right: 0, bottom: 0 }}>
        <NanoScroller onlyVertical>{listFiles}</NanoScroller>
      </div>
    </div>
  );
});

export default UploadsList;
