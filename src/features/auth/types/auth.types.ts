export namespace IAuth {
  export interface User {
    uid: string
    email: string | null
    displayName: string | null
    photoURL?: string
  }
  export interface Credentials { email: string; password: string }
  export interface SignupPayload extends Credentials { name: string }
  export interface BackendUser extends Partial<User> { firebaseUid?: string; name?: string }
  export interface SyncUserPayload { name: string }
  export interface MeResponse { user?: BackendUser; data?: BackendUser | { user?: BackendUser } }
}
