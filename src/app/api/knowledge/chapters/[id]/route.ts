import { NextRequest, NextResponse } from 'next/server'
import esClient from '@/lib/elasticsearch'

const INDEX = 'acg_knowledge_chapters'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await req.json()
    
    await esClient.update({
      index: INDEX,
      id: id,
      doc: {
        ...body,
        updatedAt: new Date().toISOString()
      },
      refresh: true
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    
    await esClient.delete({
      index: INDEX,
      id: id,
      refresh: true
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
