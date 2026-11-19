import ProjectRow from './ProjectRow'

export default function ProjectsTable({ projects }) {
  return (
    <div className="space-y-1">
      {projects.map((p) => <ProjectRow key={p._id} project={p} />)}
    </div>
  )
}
