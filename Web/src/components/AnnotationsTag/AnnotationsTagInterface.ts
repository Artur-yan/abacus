export interface IAnnotationsTagProps {
  tag: IAnnotationsTag;
  readonly?: boolean;
  deleteEnabled: boolean;
  isSelected: boolean;
  allowDelete: boolean;
  onTagClick: (tag) => void;
  onTagDelete: (tag) => void;
  onTagDeletePromise: (tag) => Promise<boolean>;
}

export interface IAnnotationsTag {
  value: string;
  label: string;
  color: string;
  isUsed: boolean;
}
