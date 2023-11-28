import * as uuid from 'uuid';

export interface ICacheMemRangeData {
  fromRow: number;
  toRow: number;
  fromCol: number;
  toCol: number;
  data: number[][];
  isRetrieving: boolean;
}

export class GridCacheMem {
  maxItemsOnCache = 100;

  colCount = 0;
  rowCount = 0;
  cache: ICacheMemRangeData[] = [];
  useId = uuid.v1();

  setSize = (rowCount, colCount) => {
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.reset();
  };

  reset = () => {
    this.useId = uuid.v1();
    this.cache = [];
  };

  save = (fromRow: number, toRow: number, fromCol: number, toCol: number, data: number[][]) => {
    this.cache.push({ fromRow, toRow, fromCol, toCol, data, isRetrieving: false });
  };

  onNeedCache: (fromRow: number, toRow: number, fromCol: number, toCol: number) => Promise<any[][]> = null;
  hasNewData: () => void = null;

  onScroll = (fromRow: number, toRow: number, fromCol: number, toCol: number, doCallRequest = true, cbFinish: () => void = null): ICacheMemRangeData[] => {
    if (this.rowCount === 0 || this.colCount === 0) {
      return [];
    }

    let fromRowOri = fromRow,
      toRowOri = toRow,
      fromColOri = fromCol,
      toColOri = toCol;

    let resFull = false;
    let res = [];
    this.cache.some((c1) => {
      if (c1.fromCol <= fromColOri && c1.toCol >= toColOri) {
        let row0 = fromRow;
        let row1 = toRow;
        if (c1.fromRow <= row0 && c1.toRow >= row1) {
          //full
          res = [c1];
          resFull = true;
          return true;
        } else {
          let addThis = false;
          if (row0 >= c1.fromRow && row0 <= c1.toRow) {
            //part inside => add to res
            addThis = true;
            fromRow = Math.max(fromRow, c1.toRow);
          }
          if (row1 >= c1.fromRow && row1 <= c1.toRow) {
            //part inside => add to res
            addThis = true;
            toRow = Math.min(toRow, c1.fromRow);
          }
          if (addThis) {
            res.push(c1);
          }
        }
      }

      if (c1.fromRow <= fromRowOri && c1.toRow >= toRowOri) {
        let col0 = fromCol;
        let col1 = toCol;
        if (c1.fromCol <= col0 && c1.toCol >= col1) {
          //full
          res = [c1];
          resFull = true;
          return true;
        } else {
          let addThis = false;
          if (col0 >= c1.fromCol && col0 <= c1.toCol) {
            //part inside => add to res
            addThis = true;
            fromCol = Math.max(fromCol, c1.toCol);
          }
          if (col1 >= c1.fromCol && col1 <= c1.toCol) {
            //part inside => add to res
            addThis = true;
            toCol = Math.min(toCol, c1.fromCol);
          }
          if (addThis) {
            res.push(c1);
          }
        }
      }
    });

    if (!resFull && doCallRequest) {
      if (fromRow <= toRow && fromCol <= toCol) {
        if (this.onNeedCache) {
          let lastId = this.useId;
          let obj1 = { fromRow, toRow, fromCol, toCol, data: null, isRetrieving: true };
          this.cache.push(obj1);

          this.onNeedCache(fromRow, toRow, fromCol, toCol).then((newCache) => {
            if (lastId !== this.useId) {
              if (this.cache != null) {
                //not really needed... but it was missing
                this.cache = this.cache.filter((c1) => c1 !== obj1);
              }
              return;
            }

            if (newCache == null) {
              //TODO we need to remove the cache... to try again...
              // this.cache = this.cache.filter(c1 => c1!==obj1);
            }

            obj1.data = newCache;
            obj1.isRetrieving = false;

            while (this.cache.length > this.maxItemsOnCache) {
              this.cache.shift();
            }

            cbFinish?.();
            this.hasNewData && this.hasNewData();
          });
        }
      }
    }

    return res;
  };
}
