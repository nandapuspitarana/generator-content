"use client"

import * as React from "react"

export type BannerFormat = "MEDIUM" | "INSTAGRAM"
export type BannerTemplateId = "classic" | "dark" | "minimal" | "quote"

export interface BannerData {
  title: string
  author: string
  genre?: string
  badgeText?: string
  tags?: string[]
  imageUrl?: string
  format: BannerFormat
  template?: BannerTemplateId
}

// ────────────────────────────────────────────
//  MEDIUM templates
// ────────────────────────────────────────────

function MediumClassic({ title, author, genre, badgeText, tags, imageUrl }: BannerData) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#e8e4dc", borderRadius: 0, position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", background: "#1c1c1c" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7% 5% 7% 7%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 2, background: "#1c1c1c", opacity: 0.4 }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#1c1c1c", opacity: 0.5, textTransform: "uppercase" }}>{badgeText || "Book Review"}</div>
        </div>
        <div>
          {genre && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "#c8102e", textTransform: "uppercase", marginBottom: 10 }}>{genre}</div>}
          <div style={{ fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, lineHeight: 0.92, color: "#1c1c1c", letterSpacing: "-2px" }}>{title || "Book Title"}</div>
          <div style={{ width: 36, height: 2, background: "#c8102e", marginTop: 14, marginBottom: 14 }} />
          <div style={{ fontSize: 11, color: "#1c1c1c", opacity: 0.5, fontStyle: "italic" }}>{author || "Author"}</div>
        </div>
        {tags && tags.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#1c1c1c", opacity: 0.35, textTransform: "uppercase" }}>Tags</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.filter(Boolean).map((tag, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#1c1c1c", border: "1px solid rgba(28,28,28,0.25)", padding: "0 10px", height: "22px", borderRadius: 11, textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxSizing: "border-box" }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: "0 0 40%", position: "relative", overflow: "hidden" }}>
        {imageUrl ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 11 }}>No Cover</div>
        )}
      </div>
    </div>
  )
}

function MediumDark({ title, author, genre, badgeText, tags, imageUrl }: BannerData) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#111111", borderRadius: 0, position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", background: "#0a0a0a" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7% 5% 7% 7%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 2, background: "#c8102e" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#c8102e", textTransform: "uppercase" }}>{badgeText || "Book Review"}</div>
        </div>
        <div>
          {genre && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "#c8102e", textTransform: "uppercase", marginBottom: 10 }}>{genre}</div>}
          <div style={{ fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, lineHeight: 0.92, color: "#ffffff", letterSpacing: "-2px" }}>{title || "Book Title"}</div>
          <div style={{ width: 36, height: 2, background: "#c8102e", marginTop: 14, marginBottom: 14 }} />
          <div style={{ fontSize: 11, color: "#888888", fontStyle: "italic" }}>{author || "Author"}</div>
        </div>
        {tags && tags.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "#666", textTransform: "uppercase" }}>Tags</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.filter(Boolean).map((tag, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", padding: "0 10px", height: "22px", borderRadius: 11, textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxSizing: "border-box" }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: "0 0 40%", position: "relative", overflow: "hidden" }}>
        {imageUrl ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 11 }}>No Cover</div>
        )}
      </div>
    </div>
  )
}

function MediumMinimal({ title, author, genre, badgeText, tags, imageUrl }: BannerData) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", borderRadius: 0, position: "relative", overflow: "hidden", display: "flex", alignItems: "stretch", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7% 5% 7% 7%", position: "relative", zIndex: 1, borderRight: "1px solid #eeeeee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 2, background: "#000000", opacity: 0.2 }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#000000", opacity: 0.4, textTransform: "uppercase" }}>{badgeText || "Book Review"}</div>
        </div>
        <div>
          {genre && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "#888888", textTransform: "uppercase", marginBottom: 10 }}>{genre}</div>}
          <div style={{ fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, lineHeight: 0.92, color: "#111111", letterSpacing: "-2px" }}>{title || "Book Title"}</div>
          <div style={{ width: 36, height: 2, background: "#111111", marginTop: 14, marginBottom: 14 }} />
          <div style={{ fontSize: 11, color: "#888888", fontStyle: "italic" }}>{author || "Author"}</div>
        </div>
        {tags && tags.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.filter(Boolean).map((tag, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#111111", border: "1px solid #dddddd", padding: "0 10px", height: "22px", borderRadius: 11, textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxSizing: "border-box" }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: "0 0 40%", position: "relative", overflow: "hidden", background: "#f5f5f5" }}>
        {imageUrl ? (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#eeeeee", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 11 }}>No Cover</div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
//  INSTAGRAM templates
// ────────────────────────────────────────────

function InstagramBook({ title, author, genre, tags, imageUrl }: BannerData) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1c1c1c", borderRadius: 0, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10%", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(135deg, #2a2a2a 0%, #1c1c1c 100%)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20, width: "100%" }}>
        {imageUrl ? (
          <div style={{ width: 250, height: 375, backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 4, boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }} />
        ) : (
          <div style={{ width: 250, height: 375, background: "#2a2a2a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: 11 }}>No Cover</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {genre && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: "#c8102e", textTransform: "uppercase", marginBottom: 12 }}>{genre}</div>}
          <div style={{ fontSize: "clamp(20px, 3.5vw, 34px)", fontWeight: 900, lineHeight: 1.1, color: "#ffffff", letterSpacing: "-1px" }}>{title || "Book Title"}</div>
          <div style={{ fontSize: 12, color: "#aaaaaa", fontStyle: "italic", marginTop: 12 }}>By {author || "Author"}</div>
          {tags && tags.filter(Boolean).length > 0 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              {tags.filter(Boolean).map((tag, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)", padding: "0 10px", height: "22px", borderRadius: 11, textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxSizing: "border-box" }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InstagramQuote({ title, author, genre, tags }: BannerData) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#0f0f0f", borderRadius: 0, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12%", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f0f 100%)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24, width: "100%" }}>
        <div style={{ width: 40, height: 3, background: "#c8102e" }} />
        {genre && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.3em", color: "#c8102e", textTransform: "uppercase" }}>{genre}</div>}
        <div style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.0, color: "#ffffff", letterSpacing: "-1px" }}>{title || "Book Title"}</div>
        <div style={{ width: 40, height: 3, background: "#c8102e" }} />
        <div style={{ fontSize: 13, color: "#aaaaaa", fontStyle: "italic" }}>— {author || "Author"}</div>
        {tags && tags.filter(Boolean).length > 0 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            {tags.filter(Boolean).map((tag, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", color: "#c8102e", border: "1px solid rgba(200,16,46,0.4)", padding: "0 12px", height: "24px", borderRadius: 12, textTransform: "uppercase", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, boxSizing: "border-box" }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
//  Main export
// ────────────────────────────────────────────

export function BannerTemplate(props: BannerData) {
  const template = props.template || "classic"
  if (props.format === "MEDIUM") {
    if (template === "dark") return <MediumDark {...props} />
    if (template === "minimal") return <MediumMinimal {...props} />
    return <MediumClassic {...props} />
  }
  // INSTAGRAM
  if (template === "quote") return <InstagramQuote {...props} />
  return <InstagramBook {...props} />
}

export const TEMPLATES = {
  MEDIUM: [
    { id: "classic" as BannerTemplateId, name: "Classic", desc: "Cream background + dark image panel", bg: "#e8e4dc" },
    { id: "dark" as BannerTemplateId, name: "Dark", desc: "All-dark moody layout", bg: "#111111" },
    { id: "minimal" as BannerTemplateId, name: "Minimal", desc: "Clean white layout", bg: "#ffffff" },
  ],
  INSTAGRAM: [
    { id: "classic" as BannerTemplateId, name: "Book Cover", desc: "Cover-centered with gradient bg", bg: "#1c1c1c" },
    { id: "quote" as BannerTemplateId, name: "Quote", desc: "Bold text-focused layout", bg: "#0f0f0f" },
  ],
}
