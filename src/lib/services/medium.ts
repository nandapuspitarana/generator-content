export interface MediumUserProfile {
  id: string
  username: string
  name: string
  url: string
  imageUrl?: string
}

export interface MediumPublication {
  id: string
  name: string
  description?: string
  url: string
  imageUrl?: string
}

export interface MediumPublishOptions {
  title: string
  content: string
  token: string
  publishStatus?: "draft" | "public" | "unlisted"
  tags?: string[]
  canonicalUrl?: string
  publicationId?: string
}

export interface MediumPublishResult {
  id: string
  title: string
  authorId: string
  url: string
  canonicalUrl?: string
  publishStatus: string
  publishedAt?: number
  license?: string
  licenseUrl?: string
  tags?: string[]
}

export async function getMediumProfile(integrationToken: string): Promise<MediumUserProfile> {
  const res = await fetch("https://api.medium.com/v1/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${integrationToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    cache: "no-store"
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gagal otentikasi Medium: ${res.status} ${err}`)
  }

  const json = await res.json()
  return json.data as MediumUserProfile
}

export async function getMediumPublications(integrationToken: string, userId: string): Promise<MediumPublication[]> {
  try {
    const res = await fetch(`https://api.medium.com/v1/users/${userId}/publications`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${integrationToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      cache: "no-store"
    })

    if (!res.ok) return []
    const json = await res.json()
    return (json.data || []) as MediumPublication[]
  } catch (e) {
    console.error("Failed to fetch Medium publications:", e)
    return []
  }
}

export async function getMediumUserId(integrationToken: string): Promise<string> {
  const profile = await getMediumProfile(integrationToken)
  return profile.id
}

export async function publishToMedium(
  titleOrOptions: string | MediumPublishOptions,
  legacyMarkdown?: string,
  legacyToken?: string
): Promise<string> {
  // Support both legacy signature (title, markdown, token) and new options object
  let options: MediumPublishOptions

  if (typeof titleOrOptions === "string") {
    options = {
      title: titleOrOptions,
      content: legacyMarkdown || "",
      token: legacyToken || "",
      publishStatus: "draft",
      tags: ["book-review", "asikreview", "reading"]
    }
  } else {
    options = titleOrOptions
  }

  const { title, content, token, publishStatus = "draft", tags, canonicalUrl, publicationId } = options

  if (!token) {
    throw new Error("Medium Integration Token wajib diisi.")
  }

  // Format tags: Medium limits tags to maximum 5, alphanumerics & hyphens, max 25 chars
  const cleanTags = (tags || ["book-review", "asikreview", "reading"])
    .slice(0, 5)
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 25))
    .filter(Boolean)

  const payload: any = {
    title,
    contentFormat: "markdown",
    content,
    publishStatus,
    tags: cleanTags,
  }

  if (canonicalUrl) {
    payload.canonicalUrl = canonicalUrl
  }

  let endpointUrl = ""

  if (publicationId) {
    endpointUrl = `https://api.medium.com/v1/publications/${publicationId}/posts`
  } else {
    const userId = await getMediumUserId(token)
    endpointUrl = `https://api.medium.com/v1/users/${userId}/posts`
  }

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gagal publikasi ke Medium (${res.status}): ${errText}`)
  }

  const data = await res.json()
  return data.data.url as string
}
