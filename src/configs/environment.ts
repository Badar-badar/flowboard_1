const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const environment = {
  api: { baseURL: required('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL) },
  firebase: {
    apiKey: required('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: required('VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: required('VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID),
    appId: required('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
  },
} as const

export default environment
