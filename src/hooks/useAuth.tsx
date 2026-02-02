import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '@/config/firebase'
import type { User } from '@/types'
import { generateAvatar } from '@/lib/avatar'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          // Check if user exists in Firestore
          const userRef = doc(db, 'users', fbUser.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const userData = userSnap.data()
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: userData.displayName || fbUser.displayName || '',
              photoURL: userData.photoURL || generateAvatar(fbUser.email || fbUser.uid),
              createdAt: userData.createdAt?.toDate() || new Date(),
              householdId: userData.householdId || null,
            })
          } else {
            // Create new user document
            const newUser: Omit<User, 'id' | 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
              email: fbUser.email || '',
              displayName: fbUser.displayName || '',
              photoURL: generateAvatar(fbUser.email || fbUser.uid),
              householdId: null,
              createdAt: serverTimestamp(),
            }

            await setDoc(userRef, newUser)

            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || '',
              photoURL: generateAvatar(fbUser.email || fbUser.uid),
              createdAt: new Date(),
              householdId: null,
            })
          }
        } catch (error) {
          console.error('Error loading user data from Firestore:', error)
          // Still set user with basic info from Firebase Auth
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || '',
            photoURL: generateAvatar(fbUser.email || fbUser.uid),
            createdAt: new Date(),
            householdId: null,
          })
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
