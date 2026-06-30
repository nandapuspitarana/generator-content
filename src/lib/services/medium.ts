export async function getMediumUserId(integrationToken: string) {
  const res = await fetch("https://api.medium.com/v1/me", {
    headers: {
      "Authorization": `Bearer ${integrationToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    }
  })
  if (!res.ok) throw new Error("Failed to get Medium User ID")
  const data = await res.json()
  return data.data.id
}

export async function publishToMedium(title: string, markdown: string, integrationToken: string) {
  const userId = await getMediumUserId(integrationToken)
  
  const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${integrationToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      title: title,
      contentFormat: "markdown",
      content: markdown,
      // Kita set status ke "draft" agar aman dan bisa direview di Medium sebelum publik.
      publishStatus: "draft",
      tags: ["book-review", "asikreview", "reading"]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error("Failed to publish to Medium: " + err)
  }
  
  const data = await res.json()
  return data.data.url // Mengembalikan URL postingan Medium
}
