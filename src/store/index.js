import { configureStore } from '@reduxjs/toolkit'
import auth from '../features/auth/authSlice'
import workspace from '../features/workspace/workspaceSlice'
import projects from '../features/projects/projectsSlice'
import tasks from '../features/tasks/tasksSlice'
import members from '../features/members/membersSlice'

export const store = configureStore({
  reducer: { auth, workspace, projects, tasks, members },
})
