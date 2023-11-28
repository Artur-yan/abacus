export interface IDataListOnePdf {
  filename?: string;
  page?: number;
  isFile?: boolean;
  totalPages?: number;
  docId?: string;
  rowId?: string;
  data?: any;
  extractedFeatures?: any;

  forceLabels?: string[];
  forceAnnotations?: {
    boundingBox?: number[];
    displayName?: string;
    boundingBoxIds?: any[];
    textExtraction?: any;
  }[];
}
