import ProjectRow from './project-row'

export default function ProjectsTable({ projects }) {
  return (
    <div>
      {projects.map((project) => <ProjectRow key={project._id} project={project} />)}
    </div>
  )
}
