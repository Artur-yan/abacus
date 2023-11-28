export enum FeatureType {
  STATIC = 'STATIC',
  SINCE_TIME = 'SINCE_TIME',
  TRAILING_WINDOW = 'TRAILING_WINDOW',
}

export const calcSchemaForFeature = (featureOne) => {
  return featureOne?.projectFeatureGroupSchema?.schema ?? featureOne?.features;
};

export const calcSchemaDuplicatedForFeature = (featureOne) => {
  return featureOne?.projectFeatureGroupSchema?.duplicateFeatures ?? featureOne?.duplicateFeatures;
};
