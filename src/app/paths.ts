export const PATHS = {
  home: '/',
  inbox: '/inbox',
  tasks: '/tasks',
  projects: '/projects',
  newProject: '/projects/new',
  projectDetail: (id = ':id') => `/projects/${id}`,
  portfolios: '/portfolios',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
}
