export interface ISearchResAction {
  name?: string;

  confirmQuestion?: string;
  confirmOkText?: string;
  doWork?: () => void;
}

export interface ISearchInOne {
  id?: 'projects' | 'datasets' | 'fg' | 'tablename' | 'models' | 'deploys' | 'help' | 'errors';
  name?: string;
  nameSingular?: string;
  color?: string;
  icon?: any;

  isSeparator?: boolean;
  hidden?: boolean;
}

export interface ISearchResOne {
  isSeparator?: boolean;

  type?: 'projects' | 'datasets' | 'fg' | 'tablename' | 'models' | 'deploys' | 'help' | 'errors';

  id?: string;
  name?: string;
  status?: string;
  date?: any;
  dateUnix?: any;
  isThisProject?: boolean;

  detail?: { [key: string]: any };
  detailIsOpen?: { [key: string]: boolean };

  link?: string | string[] | ((data?) => void);
  newWindow?: boolean;

  actions?: ISearchResAction[];
}
