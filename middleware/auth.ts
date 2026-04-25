// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  // useSupabaseUser is initialised to null on the server (no cookie hydration yet).
  // Running the guard on the server would always redirect unauthenticated, so we
  // skip the check during SSR and let the client-side pass do the real auth check.
  if (import.meta.server) return

  const user = useSupabaseUser()
  if (!user.value) {
    const localePath = useLocalePath()
    return navigateTo(localePath('/'))
  }
})
