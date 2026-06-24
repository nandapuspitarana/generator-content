"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"

interface ReviewViewerProps {
  markdown: string
}

export function ReviewViewer({ markdown }: ReviewViewerProps) {
  return (
    <div className="prose prose-sm sm:prose-base prose-gray max-w-none prose-headings:font-bold prose-a:text-blue-600">
      <ReactMarkdown>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
