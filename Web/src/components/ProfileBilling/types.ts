export interface ProfileBillingWithStripeTypes {
  isFull: boolean;
  stripeAuthKey: string;
  doCloseConfirm: (isDone: boolean) => void;
  onFinishConfirm: () => void;
}
