import { IDataListOnePdf } from './IDataListOnePdf';

export interface IAnnotationsEditProps {
  isPredDash?: boolean;
  forceRefreshing?: boolean;
  forceDataList?: IDataListOnePdf[];
}

export interface ITokenAnnotator {
  [index: number]: ITokenAnnotatorTag;
}

export interface ITokenAnnotatorTag {
  color: string;
  end: number;
  start: number;
  tag: string;
  tokens: string[];
}

export interface IErrorMessages {
  EMPTY_TAG: {
    type: string;
    message: string;
  };
  REPEATING_TAG: {
    type: string;
    message: string;
  };
  EXISTING_TAG: {
    type: string;
    message: string;
  };
}
