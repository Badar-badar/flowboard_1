import ProjectRow from './project-row'
import type { IProjects } from '../types/projects.types'

export default function ProjectsTable({ projects }: { projects: IProjects.Project[] }) {
  return (
    <div>
      {projects.map((project) => <ProjectRow key={project._id} project={project} />)}
    </div>
  )
}
