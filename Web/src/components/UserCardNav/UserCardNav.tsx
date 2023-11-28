import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Avatar from '@mui/material/Avatar';
import * as React from 'react';
import { connect } from 'react-redux';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions, { IUserAuth } from '../../stores/actions/StoreActions';
const styles = require('./UserCardNav.module.css');
const editIcon = require('@fortawesome/pro-duotone-svg-icons/faEdit').faEdit;

const AVATAR_COLOR_BY_STATE = {
  DEFAULT: '#173e7d',
  UNKNOWN_USER: '#ff0000',
  LOADING: 'transparent',
};

interface IUserCardNavProps {
  authUser?: any;
  onlyAvatarAndName?: boolean;
  noName?: boolean;
  canUpdateAvatar?: boolean;
}

interface IUserCardNavState {
  isUploading: boolean;
  imageLoadFailed: boolean;
}

class UserCardNav extends React.PureComponent<IUserCardNavProps, IUserCardNavState> {
  private unDark: any;
  unAnyError: any;

  constructor(props) {
    super(props);

    this.state = {
      isUploading: false,
      imageLoadFailed: false,
    };
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
    this.unAnyError = REActions.orgAnyError.listen(this.orgAnyError);
  }

  componentWillUnmount() {
    this.unDark();
    this.unAnyError();
  }

  orgAnyError = () => {
    this.forceUpdate();
  };

  cleanup = () => {
    this.setState({ isUploading: false });
  };

  onAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    try {
      this.setState({ isUploading: true, imageLoadFailed: false });
      const uploadResponse = await REClient_.promises_()._uploadProfileImage(file, false);
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error);
      }
      StoreActions.getAuthUser_(this.cleanup);
    } catch (error) {
      REActions.addNotificationError(error?.message ?? Constants.errorDefault);
      this.cleanup();
    }
  };

  render() {
    let { authUser, onlyAvatarAndName, noName } = this.props;
    let actualUser: IUserAuth = {};
    if (authUser) {
      if (authUser.get('data')) {
        actualUser = authUser.get('data').toJS();
      }
    }

    let actualUserSrc = calcImgSrc('/imgs/person2.jpg');
    if (actualUser?.picture) {
      actualUserSrc = calcImgSrc(actualUser.picture);
    }

    let userName = actualUser?.name;
    let initials = Utils.initials(userName) || null;
    let avatarBackgroundColor = userName ? Utils.stringToColorHex(userName) : AVATAR_COLOR_BY_STATE.DEFAULT;
    if (!this.state.imageLoadFailed) {
      avatarBackgroundColor = AVATAR_COLOR_BY_STATE.LOADING;
    }
    const avatarSize: any = onlyAvatarAndName ? (noName ? 60 : 80) : 35;
    const halfAvatarSize = Math.floor(avatarSize / 2);

    const styleR1 = window['anyError'] ? { backgroundColor: '#752424' } : {};

    let orgName = window['actualOrgName'];
    if (orgName == null) {
      orgName = actualUser.organization ? actualUser.organization.name : '';
    } else {
      actualUserSrc = null;
      userName = 'Error';
      initials = '?';
      avatarBackgroundColor = AVATAR_COLOR_BY_STATE.UNKNOWN_USER;
    }

    let AvatarWrapper = ({ children }) => <>{children}</>;

    if (this.props.canUpdateAvatar) {
      AvatarWrapper = ({ children }) => (
        <>
          <input onChange={this.onAvatarChange} accept="image/*" className={styles.input} id="avatar-input" type="file" />
          <label style={{ width: avatarSize, height: avatarSize }} className={styles.label} htmlFor="avatar-input">
            <FontAwesomeIcon
              className={styles.avatarIcon}
              spin={this.state.isUploading}
              icon={this.state.isUploading ? 'sync' : editIcon}
              style={{
                width: halfAvatarSize,
                height: halfAvatarSize,
                ...(this.state.isUploading ? { opacity: 0.8 } : {}),
              }}
            />
            {children}
          </label>
        </>
      );
    }

    return (
      <div className={onlyAvatarAndName ? '' : styles.root} style={styleR1}>
        <div className={onlyAvatarAndName ? '' : styles.rect}>
          <div style={{ display: 'block', minHeight: 36, position: 'relative', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <div style={{ float: onlyAvatarAndName ? 'none' : 'left', marginLeft: '7px', marginRight: '9px', paddingTop: '1px' }}>
              <AvatarWrapper>
                <Avatar
                  src={actualUserSrc}
                  style={{
                    margin: onlyAvatarAndName ? '0 auto 10px auto' : '',
                    width: avatarSize,
                    height: avatarSize,
                    backgroundColor: avatarBackgroundColor,
                    fontSize: '14px',
                  }}
                  imgProps={{
                    onError: () => {
                      this.setState({ imageLoadFailed: true });
                    },
                  }}
                >
                  {initials}
                </Avatar>
              </AvatarWrapper>
            </div>
            {onlyAvatarAndName && !noName && (
              <div>
                <div>
                  <span style={{ color: Utils.colorAall(0.64), whiteSpace: 'nowrap' }}>Team:&nbsp;</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{orgName}</span>
                </div>
                <div>
                  <span style={{ whiteSpace: 'nowrap' }}>{userName}</span>
                </div>
              </div>
            )}
            {!onlyAvatarAndName && (
              <div style={{ color: Utils.colorAall(0.82), paddingTop: '1px', lineHeight: /*Constants.flags.show_search_top ? 14 : */ 18 + 'px', marginRight: '8px', whiteSpace: 'nowrap', marginLeft: '48px' }}>
                <div>
                  <span style={{ fontSize: /*Constants.flags.show_search_top ? '11px' : */ '', color: Utils.colorAall(0.64), whiteSpace: 'nowrap' }}>Team:&nbsp;</span>
                  <span style={{ fontSize: /*Constants.flags.show_search_top ? '11px' : */ '', whiteSpace: 'nowrap' }}>{orgName}</span>
                </div>
                <div>
                  <span style={{ fontSize: /*Constants.flags.show_search_top ? '11px' : */ '', whiteSpace: 'nowrap' }}>{userName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    authUser: state.authUser,
  }),
  null,
)(UserCardNav);
