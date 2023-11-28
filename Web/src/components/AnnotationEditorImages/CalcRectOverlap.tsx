export interface IPageToken {
  id?;
  x?;
  y?;
  width?;
  height?;
  text?;

  dataOri?;
  page?: number;
}

export const calcRectOverlap = (r1: IPageToken, r2: IPageToken, minSpace = 0) => {
  if (r1 == null || r2 == null) {
    return false;
  } else {
    let ax1 = r1.x;
    let ay1 = r1.y;
    let ax2 = r1.x + r1.width;
    let ay2 = r1.y + r1.height;

    let bx1 = r2.x;
    let by1 = r2.y;
    let bx2 = r2.x + r2.width;
    let by2 = r2.y + r2.height;

    const xOverlap = ax1 + minSpace < bx2 && ax2 - minSpace > bx1;
    const yOverlap = ay1 + minSpace < by2 && ay2 - minSpace > by1;

    return xOverlap && yOverlap;
  }
};

export const convertBoxToRect = (bb: number[]) => {
  return {
    x: bb?.[0],
    y: bb?.[1],
    width: (bb?.[2] ?? 0) - (bb?.[0] ?? 0),
    height: (bb?.[3] ?? 0) - (bb?.[1] ?? 0),
  } as IPageToken;
};

export const calcRectOverlapBoxes = (r1: number[], r2: number[], minSpace = 0) => {
  return calcRectOverlap(convertBoxToRect(r1), convertBoxToRect(r2), minSpace);
};
