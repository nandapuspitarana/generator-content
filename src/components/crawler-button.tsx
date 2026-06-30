"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"

export function CrawlerButton() {
  const [keyword, setKeyword] = useState("bisnis dan startup")
  const [isCrawling, setIsCrawling] = useState(false)

  const handleCrawl = async () => {
    setIsCrawling(true)
    try {
      const res = await fetch("/api/cron/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword })
      })
      if (!res.ok) throw new Error("Gagal crawling")
      window.location.reload()
    } catch (err) {
      alert("Error: " + err)
    } finally {
      setIsCrawling(false)
    }
  }

  return (
    <div className="flex gap-2 w-full max-w-md">
      <Input 
        value={keyword} 
        onChange={(e) => setKeyword(e.target.value)} 
        placeholder="Masukkan kata kunci buku..."
      />
      <Button onClick={handleCrawl} disabled={isCrawling} className="bg-blue-600 hover:bg-blue-700 text-white">
        {isCrawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
        {isCrawling ? "Mencari..." : "Mulai Crawling"}
      </Button>
    </div>
  )
}
