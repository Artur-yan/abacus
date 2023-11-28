import * as React from 'react';

import { UserProfileSection } from '../UserProfile/UserProfile';

import PartsLink from './PartsLink';

import Constants from '../../constants/Constants';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import NavLeftLine from '../NavLeftLine/NavLeftLine';

interface ProfileNavLeftProps {
  navLeftCollapsed?: boolean;
  mode: PartsLink;
  profileSection: UserProfileSection;
}

export const ProfileNavLeft = React.memo(function ProfileNavLeft(props: ProfileNavLeftProps) {
  let showBilling = !Constants.flags.onprem;
  if (showBilling) {
    let authUser1 = calcAuthUserIsLoggedIn();
    if (authUser1 == null) {
      showBilling = false;
    } else {
      if (authUser1.isAdmin !== true) {
        showBilling = false;
      }
    }
  }

  const { navLeftCollapsed } = props;

  return (
    <>
      <NavLeftLine
        navLeftCollapsed={navLeftCollapsed}
        iconName={'user-alt'}
        text="Profile"
        isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.general}
        linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.general}
      />
      <NavLeftLine
        navLeftCollapsed={navLeftCollapsed}
        iconName={'users'}
        text="Team"
        isSelected={props.mode === PartsLink.profile && (props.profileSection === UserProfileSection.team || props.profileSection === UserProfileSection.invites)}
        linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.team}
      />
      {(calcAuthUserIsLoggedIn()?.isAdmin || calcAuthUserIsLoggedIn()?.isPermManageLocks) && (
        <NavLeftLine
          navLeftCollapsed={navLeftCollapsed}
          iconName={'users-class'}
          text="Groups"
          isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.groups}
          linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.groups}
        />
      )}

      <NavLeftLine
        navLeftCollapsed={navLeftCollapsed}
        iconName={'network-wired'}
        text="Connected Services"
        isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.connected_services}
        linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.connected_services}
      />
      <NavLeftLine
        navLeftCollapsed={navLeftCollapsed}
        iconName={'key'}
        text="API Keys"
        isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.apikey}
        linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.apikey}
      />

      {showBilling && (
        <>
          <NavLeftLine
            navLeftCollapsed={navLeftCollapsed}
            iconName={'wallet'}
            text="Billing"
            isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.billing}
            linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.billing}
          />
          <NavLeftLine
            navLeftCollapsed={navLeftCollapsed}
            iconName={'chart-bar'}
            text="Current Usage"
            isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.usage}
            linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.usage}
          />
          <NavLeftLine
            navLeftCollapsed={navLeftCollapsed}
            iconName={'file-invoice-dollar'}
            text="Invoices"
            isSelected={props.mode === PartsLink.profile && props.profileSection === UserProfileSection.invoices}
            linkUrl={'/' + PartsLink.profile + '/' + UserProfileSection.invoices}
          />
        </>
      )}
    </>
  );
});
