import * as React from 'react';
import { Link } from 'react-router-dom';

import { calcImgSrc } from '../../../core/Utils';
import Constants from '../../constants/Constants';
import SearchAdvancedNav from '../SearchAdvancedNav/SearchAdvancedNav';
import StoreActions from '../../stores/actions/StoreActions';

const styleRoot: React.CSSProperties = {
  display: 'block',
  position: 'absolute',
  backgroundColor: Constants.navBackColor(),
  top: 0 + 'px',
  bottom: Constants.NavBottomHeight + 'px',
  left: 0,
  width: Constants.navWidthExtended + 'px',
};

export class SearchAdvNavLeft extends React.PureComponent {
  render() {
    return (
      <div id={'navLeftOne'} ref={'root'} style={styleRoot}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: (Constants.flags.show_search_top ? 0 || Constants.headerHeight() : Constants.headerHeight()) + 'px',
            left: 0,
            width: Constants.navWidthExtended + 'px',
            textAlign: 'center',
            backgroundColor: Constants.navHeaderColor(),
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <span style={{ cursor: 'pointer', color: 'white', fontWeight: 500, fontSize: '20px', display: 'table', margin: 'auto auto', paddingRight: '2px' }}>
              <span style={{ verticalAlign: 'top', display: 'table-cell' }}>
                <span style={{ color: 'white' }}>
                  <Link
                    to={'/'}
                    onClick={() => {
                      StoreActions.getProjectsList_();
                    }}
                  >
                    <img alt={''} src={calcImgSrc('/app/imgs/logo_text' + 80 + '.png')} style={{ width: '182px' }} />
                  </Link>
                </span>
              </span>
            </span>
          </div>
        </div>
        <div style={{ position: 'absolute', top: (Constants.flags.show_search_top ? 0 || Constants.headerHeight() : Constants.headerHeight()) + 'px', left: 0, right: 0, bottom: 0 + 'px' }}>
          <SearchAdvancedNav />
        </div>
      </div>
    );
  }
}
