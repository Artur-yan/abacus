export enum FGLockType {
  Org = 0,
  Lock = 1,
  MyGroups = 2,
}

export enum FGLangType {
  SQL = 'sql',
  Python = 'python',
  Streaming = 'streaming',
  Template = 'template',
}

export const calcLangType = (v1) => {
  if (v1 == null) {
    return v1;
  } else if (v1?.toLowerCase() === FGLangType.Python.toLowerCase()) {
    return FGLangType.Python;
  } else if (v1?.toLowerCase() === FGLangType.Streaming.toLowerCase()) {
    return FGLangType.Streaming;
  } else {
    return FGLangType.SQL;
  }
};
