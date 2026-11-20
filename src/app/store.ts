import { configureStore } from '@reduxjs/toolkit'
import auth from '../features/auth/store/auth.slice'
import workspace from '../features/workspace/store/workspace.slice'
import projects from '../features/projects/store/projects.slice'
import tasks from '../features/tasks/store/tasks.slice'
import members from '../features/members/store/members.slice'

export const store = configureStore({
  reducer: { auth, workspace, projects, tasks, members },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
