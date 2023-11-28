import * as React from 'react';
import { usePipeline } from '../../api/REUses';
import { useAppSelector } from '../../../core/hooks';
import NBEditor from '../NBEditor/NBEditor';
import StoreActions from '../../stores/actions/StoreActions';

export const PipelineNotebook = React.memo(() => {
  const pipelineId = useAppSelector((state) => state.paramsProp?.get('pipelineId'));
  const navParamsImmutable = useAppSelector((state) => state.navParams);
  const pipeline = usePipeline(pipelineId);

  React.useEffect(() => {
    const navParams = navParamsImmutable.set('pipelineName', pipeline?.pipelineName);
    StoreActions.setNavParams_(navParams.toJS());
  }, [pipeline?.pipelineName]);

  return <NBEditor />;
});
