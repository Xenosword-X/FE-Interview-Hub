// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value) {
    const { $localePath } = useNuxtApp()
    return navigateTo($localePath('/'))
  }
})
