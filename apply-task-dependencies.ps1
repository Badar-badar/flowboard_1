param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$backend = 'C:\mern_projects\Task Desk\src'
$updates = @{}
$lineEndings = @{}

function Replace-Exact([string]$relativePath, [string]$oldText, [string]$newText) {
  $path = Join-Path $backend $relativePath
  if ($updates.ContainsKey($relativePath)) { $text = $updates[$relativePath] }
  else {
    $text = [System.IO.File]::ReadAllText($path)
    $lineEndings[$relativePath] = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
    $text = $text.Replace("`r`n", "`n")
  }
  $oldText = $oldText.Replace("`r`n", "`n")
  $newText = $newText.Replace("`r`n", "`n")
  if (-not $text.Contains($oldText)) { throw "Expected source block not found in $relativePath" }
  $updates[$relativePath] = $text.Replace($oldText, $newText)
}

Replace-Exact 'models\task.model.ts' @'
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
'@ @'
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],
    dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }],
'@

Replace-Exact 'interfaces\iTask.ts' @'
    projectIds?: Types.ObjectId[];
    title: string;
'@ @'
    projectIds?: Types.ObjectId[];
    dependencies?: Types.ObjectId[];
    title: string;
'@

Replace-Exact 'interfaces\iTask.ts' @'
    dueDate?: Date | null;
  }
}
'@ @'
    dueDate?: Date | null;
    dependencies?: string[] | Types.ObjectId[];
  }
}
'@

Replace-Exact 'validators\task.validator.ts' @'
  dueDate: z.coerce.date().nullable().optional(),
  completedAt: z.unknown().optional(),
'@ @'
  dueDate: z.coerce.date().nullable().optional(),
  dependencies: z.array(z.string().refine(mongoose.isValidObjectId, "Invalid dependency task ID")).max(50).optional(),
  completedAt: z.unknown().optional(),
'@

Replace-Exact 'controllers\task.controller.ts' @'
import { ProjectModel } from "../models/project.model";
'@ @'
import { ProjectModel } from "../models/project.model";
import { TaskModel } from "../models/task.model";
'@

Replace-Exact 'controllers\task.controller.ts' @'
    projectIds: [...new Set([data.projectId.toString(), ...(data.projectIds ?? []).map((id) => id.toString())])],
    attachments,
'@ @'
    projectIds: [...new Set([data.projectId.toString(), ...(data.projectIds ?? []).map((id) => id.toString())])],
    dependencies: (data.dependencies ?? []).map((id) => id.toString()),
    attachments,
'@

Replace-Exact 'controllers\task.controller.ts' @'
const assertProjectMember = async (projectId: Types.ObjectId | string, userId: string) => {
  const member = await ProjectMemberModel.exists({ projectId, userId });
  if (!member) {
    throw new AppError(400, "VALIDATION_ERROR", "Assignee must be a member of this project");
  }
};
'@ @'
const assertProjectMember = async (projectId: Types.ObjectId | string, userId: string) => {
  const member = await ProjectMemberModel.exists({ projectId, userId });
  if (!member) {
    throw new AppError(400, "VALIDATION_ERROR", "Assignee must be a member of this project");
  }
};

const assertDependencies = async (taskId: Types.ObjectId, workspaceId: Types.ObjectId, userId: Types.ObjectId, dependencyIds: string[]) => {
  if (new Set(dependencyIds).size !== dependencyIds.length) throw new AppError(400, "VALIDATION_ERROR", "Duplicate dependencies are not allowed");
  if (dependencyIds.includes(taskId.toString())) throw new AppError(400, "VALIDATION_ERROR", "A task cannot depend on itself");
  if (!dependencyIds.length) return;

  const targets = await TaskModel.find({ _id: { $in: dependencyIds }, workspaceId, deletedAt: null }).select("_id projectId projectIds dependencies");
  if (targets.length !== dependencyIds.length) throw new AppError(400, "VALIDATION_ERROR", "Dependencies must be active tasks in this workspace");
  const projectIds = targets.flatMap((target) => [target.projectId, ...(target.projectIds ?? [])]);
  const membership = await ProjectMemberModel.exists({ projectId: { $in: projectIds }, userId });
  if (!membership) throw new AppError(404, "DEPENDENCY_NOT_FOUND", "Dependency task not found");

  const visited = new Set<string>();
  let pending = targets.flatMap((target) => (target.dependencies ?? []).map((id) => id.toString()));
  while (pending.length) {
    const next = [...new Set(pending)].filter((id) => !visited.has(id));
    pending = [];
    if (next.includes(taskId.toString())) throw new AppError(400, "CYCLIC_DEPENDENCY", "This dependency would create a cycle");
    next.forEach((id) => visited.add(id));
    const linked = await TaskModel.find({ _id: { $in: next }, workspaceId, deletedAt: null }).select("dependencies").lean();
    pending = linked.flatMap((item) => (item.dependencies ?? []).map((id) => id.toString()));
  }
};
'@

Replace-Exact 'controllers\task.controller.ts' @'
    if (updates.assigneeId) {
      await assertProjectMember(req.projectId!, updates.assigneeId.toString());
    }

    const task = await updateTaskWithAttachments(req.workspaceId!, taskId, updates, files);
'@ @'
    if (updates.assigneeId) {
      await assertProjectMember(req.projectId!, updates.assigneeId.toString());
    }
    if (updates.dependencies) {
      await assertDependencies(req.task!._id, req.workspaceId!, req.user!._id, updates.dependencies.map(String));
    }

    const task = await updateTaskWithAttachments(req.workspaceId!, taskId, updates, files);
'@

if ($Apply) {
  foreach ($relativePath in $updates.Keys) {
    $path = Join-Path $backend $relativePath
    $output = $updates[$relativePath]
    if ($lineEndings[$relativePath] -eq "`r`n") { $output = $output.Replace("`n", "`r`n") }
    [System.IO.File]::WriteAllText($path, $output, [System.Text.UTF8Encoding]::new($false))
  }
  Write-Output "Updated $($updates.Count) backend files."
} else {
  Write-Output "Backend patch preflight passed for $($updates.Count) files; no files were changed. Run with -Apply to write the patch."
}
