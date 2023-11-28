import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./HelpItemsNavLinks.module.css');
const sd = require('../antdUseDark.module.css');

interface IHelpItemsNavLinksProps {}

const HelpItemsNavLinks = React.memo((props: PropsWithChildren<IHelpItemsNavLinksProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [linkToBilling, setLinkToBilling] = useState(null);

  const mode = paramsProp?.get('mode');
  const profileSection = paramsProp.get('section');

  useEffect(() => {
    if (mode === PartsLink.profile && profileSection === UserProfileSection.usage) {
      REClient_.client_()._billingGetUrl((err, res) => {
        setLinkToBilling(res?.result || null);
      });
    } else {
      setLinkToBilling(null);
    }
  }, [mode, profileSection]);

  return (
    <div>
      <div style={{ padding: '0 20px' }}>
        <Link newWindow to={'/help/overview'} style={{ cursor: 'pointer' }}>
          Documentation
        </Link>
        {linkToBilling != null && (
          <span>
            &nbsp;&nbsp;
            <Link to={linkToBilling} newWindow noApp usePointer>
              <span
                css={`
                  margin-right: 2px;
                `}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faEarth').faEarth} transform={{ size: 12, x: 0, y: 0 }} style={{ cursor: 'pointer' }} />
              </span>
              Pricing
            </Link>
          </span>
        )}
        {Constants.flags.show_log_links && (
          <span>
            &nbsp;&nbsp;
            <Link newWindow to={'/api/_getPipelineLog'} noApp style={{ cursor: 'pointer' }}>
              Pipeline Logs
            </Link>
          </span>
        )}
        {/*&nbsp;&nbsp;<span style={{ color: Utils.colorA(0.6), }}>|</span>&nbsp;&nbsp;*/}
        {/*<Link newWindow style={{ cursor: 'pointer', }} to={'/models/'} noApp>{Constants.devCenterName}</Link>*/}
      </div>
    </div>
  );
});

export default HelpItemsNavLinks;
