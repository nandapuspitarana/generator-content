"use client"

import * as React from "react"
import { CanvasElement } from "@/app/dashboard/canvas/[id]/page"

interface CustomBannerRendererProps {
  elements: CanvasElement[]
  bgColor: string
  width: number
  height: number
  data: {
    title?: string
    author?: string
    genre?: string
    badgeText?: string
    tags?: string
    imageUrl?: string
    themeColor?: string
  }
}

export function CustomBannerRenderer({ elements, bgColor, width, height, data }: CustomBannerRendererProps) {
  const renderElementContent = (el: CanvasElement) => {
    let text = el.text
    let src = el.src
    
    // Resolve bindings from article data
    if (el.bindTo && el.bindTo !== "none") {
      if (el.bindTo === "title") text = data.title || "Atomic Habits"
      if (el.bindTo === "author") text = data.author || "James Clear"
      if (el.bindTo === "genre") text = data.genre || "Self-Help"
      if (el.bindTo === "badgeText") text = data.badgeText || "Book Review"
      if (el.bindTo === "imageUrl") src = data.imageUrl || "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
    }

    let currentColor = el.color
    let currentBgColor = el.bgColor
    if (el.bindTo === "color") {
      currentColor = data.themeColor || "#c8102e"
      currentBgColor = data.themeColor || "#c8102e"
    }

    if (el.type === "text") {
      if (el.bindTo === "tags") {
        const tagsList = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : ["Productivity", "Habits", "Life"]
        return (
          <div style={{ width: "100%", height: "100%", display: "flex", flexWrap: "wrap", gap: "10px", alignContent: "flex-start", overflow: "hidden" }}>
            {tagsList.map((t, i) => (
              <span key={i} style={{ fontSize: `${el.fontSize}px`, color: currentColor, fontWeight: el.fontWeight, padding: "0.2em 0.8em", border: `1px solid ${currentColor}`, borderRadius: "99px", whiteSpace: "nowrap" }}>
                {t}
              </span>
            ))}
          </div>
        )
      }
      return (
        <div style={{ width: "100%", height: "100%", fontSize: `${el.fontSize}px`, color: currentColor, fontWeight: el.fontWeight, textAlign: el.textAlign || "left", display: "flex", alignItems: "center", lineHeight: 1.2 }}>
          {text}
        </div>
      )
    }
    
    if (el.type === "image" && src) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt="element" style={{ width: "100%", height: "100%", objectFit: el.objectFit || "cover", pointerEvents: "none", borderRadius: `${el.borderRadius || 0}px` }} crossOrigin="anonymous" />
    }
    
    if (el.type === "shape") {
      return <div style={{ width: "100%", height: "100%", backgroundColor: currentBgColor, borderRadius: `${el.borderRadius}px` }} />
    }
    return null
  }

  const topLevelElements = elements.filter(el => !el.groupId)

  return (
    <div style={{ width: width, height: height, backgroundColor: bgColor, position: "relative", overflow: "hidden" }}>
      {topLevelElements.map((el) => {
        return (
          <div 
            key={el.id}
            style={{ 
              position: "absolute", 
              left: el.x, 
              top: el.y, 
              width: el.w, 
              height: el.h, 
              zIndex: el.zIndex || 1 
            }}
          >
            {el.type === "group" ? (
              <div className="w-full h-full relative">
                {elements.filter(child => child.groupId === el.id).map(child => (
                  <div key={child.id} style={{ position: "absolute", left: child.x, top: child.y, width: child.w, height: child.h, zIndex: child.zIndex || 1 }}>
                    {renderElementContent(child)}
                  </div>
                ))}
              </div>
            ) : (
              renderElementContent(el)
            )}
          </div>
        )
      })}
    </div>
  )
}
