let GhostContentAPI: any = null

async function loadGhostAPI() {
  if (!GhostContentAPI) {
    const module = await import('@tryghost/content-api')
    GhostContentAPI = module.default
  }
  return GhostContentAPI
}

let ghostAPI: any = null

async function getGhostAPI() {
  if (!ghostAPI && process.env.NEXT_PUBLIC_GHOST_URL && process.env.NEXT_PUBLIC_GHOST_CONTENT_KEY) {
    const API = await loadGhostAPI()
    ghostAPI = new API({
      url: process.env.NEXT_PUBLIC_GHOST_URL,
      key: process.env.NEXT_PUBLIC_GHOST_CONTENT_KEY,
      version: 'v5.0',
    })
  }
  return ghostAPI
}

export type GhostPost = {
  id: string
  title: string
  slug: string
  excerpt?: string
  html?: string
  feature_image?: string
  published_at?: string
  updated_at?: string
  url?: string
}

export async function getGhostPosts(): Promise<GhostPost[]> {
  try {
    const api = await getGhostAPI()
    if (!api) {
      console.warn('Ghost API not configured')
      return []
    }
    const posts = await api.posts.browse({
      limit: 'all',
      fields: 'id,title,slug,excerpt,feature_image,published_at,updated_at,url,html',
      include: ['tags', 'authors'],
    })
    // Normalize posts to match GhostPost type (provide defaults for required fields)
    return posts.map((p: any) => ({
      id: p.id || '',
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt ?? undefined,
      html: p.html ?? undefined,
      feature_image: p.feature_image ?? undefined,
      published_at: p.published_at ?? undefined,
      updated_at: p.updated_at ?? undefined,
      url: p.url ?? undefined,
    }))
  } catch (error) {
    console.error('Error fetching Ghost posts:', error)
    return []
  }
}

export async function getGhostPostBySlug(slug: string): Promise<GhostPost | null> {
  try {
    const api = await getGhostAPI()
    if (!api) {
      console.warn('Ghost API not configured')
      return null
    }
    const posts = await api.posts.browse({
      filter: `slug:${slug}`,
      limit: 1,
      include: ['tags', 'authors'],
    })
    const found = posts?.[0]
    if (!found) return null
    return {
      id: found.id || '',
      title: found.title || '',
      slug: found.slug || '',
      excerpt: found.excerpt ?? undefined,
      html: found.html ?? undefined,
      feature_image: found.feature_image ?? undefined,
      published_at: found.published_at ?? undefined,
      updated_at: found.updated_at ?? undefined,
      url: found.url ?? undefined,
    }
  } catch (error) {
    console.error(`Error fetching Ghost post "${slug}":`, error)
    return null
  }
}
