<!-- pages/admin/questions/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Translation {
  locale: string
  title: string
  body_md: string
}

interface AdminQuestion {
  id: string
  slug: string
  category: string
  difficulty: string
  tags: string[]
  is_published: boolean
  created_at: string
  translations: Translation[]
}

const { data: questions, refresh } = await useAsyncData(
  'admin-questions',
  () => $fetch<AdminQuestion[]>('/api/admin/questions')
)

const search         = ref('')
const filterCategory = ref('')
const confirmDelete  = ref<string | null>(null)
const deleting       = ref(false)
const deleteError    = ref('')

const categories = ['javascript', 'vue', 'css', 'typescript', 'react', 'web-vitals', 'browser', 'http']

const filtered = computed(() => {
  if (!questions.value) return []
  return questions.value.filter(q => {
    const zhTitle = q.translations.find(t => t.locale === 'zh')?.title ?? ''
    const matchSearch = !search.value
      || q.slug.toLowerCase().includes(search.value.toLowerCase())
      || zhTitle.includes(search.value)
    const matchCat = !filterCategory.value || q.category === filterCategory.value
    return matchSearch && matchCat
  })
})

async function deleteQuestion(id: string) {
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/admin/questions/${id}`, { method: 'DELETE' })
    confirmDelete.value = null
    await refresh()
  } catch (err: any) {
    deleteError.value = err?.data?.message ?? 'Delete failed, please try again'
    confirmDelete.value = null
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header row -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-slate-800">
        Questions
        <span class="text-sm font-normal text-slate-400 ml-2">{{ filtered.length }}</span>
      </h1>
      <NuxtLink
        to="/admin/questions/new"
        class="bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
      >
        + New Question
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-5">
      <input
        v-model="search"
        type="text"
        placeholder="Search slug or title…"
        class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
      />
      <select
        v-model="filterCategory"
        class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Delete error -->
    <p v-if="deleteError" class="text-xs text-red-500 mb-3">{{ deleteError }}</p>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Difficulty</th>
            <th class="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Published</th>
            <th class="px-4 py-3 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="q in filtered" :key="q.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ q.slug }}</td>
            <td class="px-4 py-3 text-slate-600">{{ q.category }}</td>
            <td class="px-4 py-3 text-slate-600">{{ q.difficulty }}</td>
            <td class="px-4 py-3">
              <span
                :class="q.is_published ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'"
                class="text-[11px] font-medium px-2 py-0.5 rounded"
              >
                {{ q.is_published ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <NuxtLink
                  :to="`/admin/questions/${q.id}/edit`"
                  class="text-xs text-indigo-500 hover:underline"
                >
                  Edit
                </NuxtLink>

                <template v-if="confirmDelete !== q.id">
                  <button
                    @click="confirmDelete = q.id"
                    class="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </template>
                <template v-else>
                  <span class="text-xs text-slate-500">Sure?</span>
                  <button
                    @click="deleteQuestion(q.id)"
                    :disabled="deleting"
                    class="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    @click="confirmDelete = null"
                    class="text-xs text-slate-400 hover:underline"
                  >
                    No
                  </button>
                </template>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-400">
              No questions found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
