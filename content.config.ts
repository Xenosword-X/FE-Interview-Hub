// content.config.ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const questionSchema = z.object({
  slug:       z.string(),
  title:      z.string(),
  category:   z.string(),
  tags:       z.array(z.string()),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
})

export default defineContentConfig({
  collections: {
    questions: defineCollection({
      type: 'page',
      source: '**/questions/**/*.md',
      schema: questionSchema,
    }),
  },
})
