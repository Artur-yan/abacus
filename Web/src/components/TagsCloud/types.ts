interface TagOption {
  value: string;
  count: number;
}

interface TagsCloudInterface {
  classNames?: string;
  minSize?: number;
  maxSize?: number;
  shuffle?: boolean;
  tags: TagOption[] | [];
  selectedTag: TagOption;
  onTagSelect: (tag: TagOption) => void;
  containerRef?: any;
}

export { TagOption, TagsCloudInterface };
