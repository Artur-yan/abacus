import * as React from 'react';

import PartsLink from './PartsLink';
import { IconProject } from './utils';

import NavLeftLine from '../NavLeftLine/NavLeftLine';

interface ProjectsNavLeftProps {
  mode: PartsLink;
  calcLinkToProject: (v1: string, extra?: any) => string | string[];
  navLeftCollapsed: boolean;
  projectName?: string;
}

export const ProjectsNavLeft = React.memo(function ProjectsNavLeft(props: ProjectsNavLeftProps) {
  return (
    <>
      <NavLeftLine
        navLeftCollapsed={props.navLeftCollapsed}
        iconName={IconProject}
        text="Projects"
        isFolderSelected={props.mode === PartsLink.project_add || props.mode === PartsLink.docker_add}
        isSelected={props.mode === PartsLink.project_list}
        isTitle={false}
        linkUrl={'/' + PartsLink.project_list}
      />
      {props.mode === PartsLink.project_add && <NavLeftLine navLeftCollapsed={props.navLeftCollapsed} indent={1} text="Project Add" isSelected={props.mode === PartsLink.project_add} isTitle={false} />}
      {(props.mode === PartsLink.project_dashboard || props.projectName != null) && (
        <NavLeftLine
          navLeftCollapsed={props.navLeftCollapsed}
          maxCharsLen={50}
          allowMultiLine
          indent={1}
          text={props.projectName || 'Detail'}
          isSelected={props.mode === PartsLink.project_dashboard}
          isTitle={false}
          linkUrl={props.calcLinkToProject(PartsLink.project_dashboard, props.mode === PartsLink.dataset_schema || props.mode === PartsLink.dataset_for_usecase ? null : '?doUpload=true')}
        />
      )}
    </>
  );
});
