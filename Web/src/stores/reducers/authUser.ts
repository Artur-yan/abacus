import * as Immutable from 'immutable';
import Utils from '../../../core/Utils';
import { IPermGroupOne } from '../../components/UserGroupsBelong/UserGroupsBelong';
import StoreActions from '../actions/StoreActions';

export interface IAuthUser {
  isRefreshing?: boolean;
  data?: object;
  isLoggedIn?: boolean;
  neverDone?: boolean;
}

export type IAuthUserImmutable = Immutable.Record<IAuthUser>;

export enum EUserPerms {
  ADMIN = 'ADMIN',
  API_KEYS = 'API_KEYS',
  BILLING = 'BILLING',
  INVITE_USERS = 'INVITE_USERS',
  MANAGE_OBJECT_LOCKS = 'MANAGE_OBJECT_LOCKS',
  MODIFY = 'MODIFY',
  VIEW = 'VIEW',
}

export const needsBillingDirectCheck = (data: any) => {
  return false;
  // if(Constants.flags.show_billing) {
  //   if (data?.organization?.billingPlan === 'cc') {
  //     if (data?.organization?.info?.preferences?.payment_done === true) {
  //       return false;
  //     } else {
  //       return true;
  //     }
  //   }
  // }
  // return false;
};

export const needsBillingDirectCheckModal = (data: any) => {
  if (data?.organization?.billingPlan === 'cc') {
    if (data?.organization?.info?.preferences?.payment_done === true) {
      return false;
    } else {
      return true;
    }
  }
  return null;
};

export const needsGotoBilling = (result1: any) => {
  return false; //needsBillingDirectCheck(result1);
};

export const calcAuthUserIsLoggedIn: (state?: any) => {
  isPermManageLocks: boolean;
  userPermissions: string[];
  orgGroups: IPermGroupOne[];
  orgCreatedAt: any;
  solutionsOverrides: any;
  paymentDone: any;
  paymentError: any;
  enabled2fa: any;
  isInternal: any;
  orgId: any;
  userHandle: any;
  orgWorkspace: any;
  orgEndpoint: any;
  orgName: any;
  email: any;
  canUse: any;
  canJoinOrg: any;
  organizationDiscover: any;
  forceVerification: any;
  userId: any;
  needBilling: any;
  emailValidateNeeded: any;
  emailChannels: any;
  preferences: any;
  isAdmin: any;
  isLoggedIn: any;
  isRefreshing: any;
  neverDone: any;
  alreadyOrgId: any;
  forceTwofa: any;
} = (state?: any) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.authUser) {
    state = state.authUser;
  }

  let isLoggedIn = (state as IAuthUserImmutable).get('isLoggedIn');
  let isRefreshing = (state as IAuthUserImmutable).get('isRefreshing');
  let neverDone = (state as IAuthUserImmutable).get('neverDone');

  // @ts-ignore
  let data1 = (state as IAuthUserImmutable).get('data');
  let emailValidateNeeded = null;

  let solutionsOverrides = null,
    orgGroups = null,
    orgCreatedAt = null,
    paymentDone = null,
    paymentError = null,
    enabled2fa = null,
    isInternal = null,
    orgId = null,
    canUse = false,
    orgName = null,
    userHandle = null,
    orgWorkspace = null,
    orgEndpoint = null,
    email = null,
    alreadyOrgId = null,
    userId = null,
    isAdmin = null,
    canJoinOrg = null,
    preferences = null,
    emailChannels = null,
    needBilling = null,
    forceVerification = null,
    organizationDiscover = null,
    forceTwofa = null;
  if (Immutable.isImmutable(data1)) {
    canUse = data1 != null;
    preferences = data1?.getIn(['info', 'preferences']);
    emailChannels = data1?.getIn(['emailChannels']);
    orgId = data1?.getIn(['organization', 'organizationId']);
    isAdmin = data1?.get('organizationAdmin');
    emailValidateNeeded = data1?.getIn(['emailValidated']);
    needBilling = needsBillingDirectCheckModal(data1?.toJS());
    userId = data1?.getIn(['userId']);
    userHandle = data1?.getIn(['userHandle']);
    forceVerification = data1?.getIn(['forceVerification']);
    organizationDiscover = data1?.getIn(['organization', 'discoverable']);
    canJoinOrg = data1?.getIn(['canJoinOrg']);
    email = data1?.getIn(['email']);
    orgName = data1?.getIn(['organization', 'name']);
    orgWorkspace = data1?.getIn(['organization', 'workspace']);
    orgEndpoint = data1?.getIn(['organization', 'ingressName']);
    isInternal = data1?.getIn(['internal']);
    enabled2fa = data1?.getIn(['twofaEnabled']);
    paymentDone = (data1?.toJS() as any)?.organization?.info?.preferences?.payment_done;
    paymentError = (data1?.toJS() as any)?.organization?.info?.preferences?.payment_error;
    solutionsOverrides = (data1?.toJS() as any)?.organization?.info?.solutions_overrides;
    orgCreatedAt = (data1?.toJS() as any)?.organization?.createdAt;
    orgGroups = (data1?.toJS() as any)?.organizationGroups;
    forceTwofa = data1?.get('forceTwofa');
  } else {
    canUse = data1 != null;
    preferences = (data1 as any)?.info?.preferences;
    emailChannels = (data1 as any)?.emailChannels;
    orgId = (data1 as any)?.organization?.organizationId;
    isAdmin = (data1 as any)?.organizationAdmin;
    emailValidateNeeded = (data1 as any)?.emailValidated;
    needBilling = needsBillingDirectCheckModal(data1);
    userId = (data1 as any)?.userId;
    userHandle = (data1 as any)?.userHandle;
    forceVerification = (data1 as any)?.forceVerification;
    organizationDiscover = (data1 as any)?.organization?.discoverable;
    canJoinOrg = (data1 as any)?.canJoinOrg;
    email = (data1 as any)?.email;
    orgName = (data1 as any)?.organization?.name;
    orgWorkspace = (data1 as any)?.organization?.workspace;
    orgEndpoint = (data1 as any)?.organization?.ingressName;
    isInternal = (data1 as any)?.internal;
    enabled2fa = (data1 as any)?.enabled2fa;
    paymentDone = (data1 as any)?.organization?.info?.preferences?.payment_done;
    paymentError = (data1 as any)?.organization?.info?.preferences?.payment_error;
    solutionsOverrides = (data1 as any)?.organization?.info?.solutions_overrides;
    orgCreatedAt = (data1 as any)?.organization?.createdAt;
    orgGroups = (data1 as any)?.organizationGroups;
    forceTwofa = (data1 as any)?.forceTwofa;
  }

  let userPermissions = null;
  if (orgGroups != null) {
    userPermissions = [];
    orgGroups?.some((g1) => {
      g1?.permissions?.some((p1) => {
        if (!userPermissions.includes(p1)) {
          userPermissions.push(p1);
        }
      });
    });
  }
  let isPermManageLocks = userPermissions == null ? null : userPermissions.includes(EUserPerms.MANAGE_OBJECT_LOCKS);

  // let forceShow = solutionsOverrides?.force_show;

  if (emailValidateNeeded != null) {
    emailValidateNeeded = emailValidateNeeded !== true;
  }

  alreadyOrgId = orgId != null && orgId !== '' && orgId !== '0';
  if (alreadyOrgId === false) {
    orgId = null;
  }

  return {
    userPermissions,
    isPermManageLocks,
    orgGroups,
    orgCreatedAt,
    solutionsOverrides,
    paymentDone,
    paymentError,
    enabled2fa,
    isInternal,
    orgId,
    userHandle,
    orgWorkspace,
    orgEndpoint,
    orgName,
    email,
    canUse,
    canJoinOrg,
    organizationDiscover,
    forceVerification,
    userId,
    needBilling,
    emailValidateNeeded,
    emailChannels,
    preferences,
    isAdmin,
    isLoggedIn,
    isRefreshing: isRefreshing,
    neverDone,
    alreadyOrgId,
    forceTwofa,
  };
};

export const calcAuthUserOrgs = (state?: any) => {
  if (!state) {
    state = Utils.globalStore().getState();
  }

  if (state.authUser) {
    state = state.authUser;
  }

  return state.get('orgs');
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  data: null,
  isLoggedIn: null,
  neverDone: true,
  orgs: null,
  cpuAndMemory: null,
  twoFactorAuthentication: {
    initialize: false,
    inprogress: false,
  },
}) as Immutable.Map<string, any>;

const authUser = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.GET_AUTH_ORGS_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.GET_AUTH_ORGS_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('orgs', action.payload.list ?? []);

      return state;

    case StoreActions.ORG_CPU_MEMORY_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.ORG_CPU_MEMORY_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.set('cpuAndMemory', action.payload.result ?? {});

      return state;

    case StoreActions.GET_AUTH_USER_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      state = state.set('neverDone', false);

      return state;

    case StoreActions.FORCE_AUTH_USER_DATA:
    case StoreActions.GET_AUTH_USER_END:
      if (action.type !== StoreActions.FORCE_AUTH_USER_DATA) {
        state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      }

      let data1 = action.payload;
      data1 = data1 ? data1.user : null;

      state = state.set('isLoggedIn', data1 != null);
      state = state.set('neverDone', false);

      if (data1 != null && !Immutable.isImmutable(data1)) {
        data1 = Immutable.fromJS(data1);
      }
      state = state.set('data', data1);

      return state;

    case StoreActions.GET_AUTH_LOGOUT:
      state = state.set('isLoggedIn', null);
      state = state.set('data', null);

      return state;

    case StoreActions.INITIALIZE_2FA:
      state = state.setIn(['twoFactorAuthentication', 'initialize'], action.payload.initialize);
      return state;

    case StoreActions.TWO_FA_INPROGRESS:
      state = state.setIn(['twoFactorAuthentication', 'inprogress'], action.payload.inprogress);
      return state;

    default:
      return state;
  }
};

authUser.calcCpuAndMemory = (state?: any) => {
  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.authUser) {
    state = state.authUser;
  }

  return state.getIn(['cpuAndMemory']);
};

authUser.memCpuAndMemory = (doCall) => {
  let state = Utils.globalStore().getState();
  if (state.authUser) {
    state = state.authUser;
  }

  let res = authUser.calcCpuAndMemory();
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.cpuAndMemoryRefresh_();
      }
    }
  }
};

export default authUser;
