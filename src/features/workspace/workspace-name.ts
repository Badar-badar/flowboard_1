export function getDefaultWorkspaceName(user) {
  const first = user?.displayName?.trim().split(/\s+/)[0]
  if (first) return `${first}'s workspace`

  const emailName = user?.email?.split('@')[0]
  if (emailName) return `${emailName}'s workspace`

  return 'My workspace'
}