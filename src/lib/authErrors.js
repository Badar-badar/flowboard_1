export function authErrorMessage(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use': return 'This email is already registered.'
    case 'auth/invalid-email': return 'Please enter a valid email.'
    case 'auth/weak-password': return 'Password must be at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Incorrect email or password.'
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.'
    case 'auth/network-request-failed': return 'Network error. Check your connection.'
    case 'auth/popup-closed-by-user': return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked': return 'Your browser blocked the sign-in popup. Allow popups and try again.'
    case 'auth/unauthorized-domain': return 'This domain is not authorized for Firebase sign-in.'
    case 'auth/operation-not-allowed': return 'This sign-in method is disabled in Firebase Authentication settings.'
    case 'auth/account-exists-with-different-credential': return 'An account already exists with this email using a different sign-in method.'
    default: return 'Something went wrong. Please try again.'
  }
}
