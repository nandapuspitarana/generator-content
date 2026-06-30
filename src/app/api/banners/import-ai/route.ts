import { NextResponse } from "next/server";
import { importBannerWithAI, ImportBannerRequest } from "@/lib/services/llm";

export async function POST(req: Request) {
  try {
    const body = await req.json() as ImportBannerRequest;
    
    if (!body.type || !body.content || !body.format) {
      return NextResponse.json({ error: "Missing required fields: type, content, format" }, { status: 400 });
    }

    if (body.type !== "image" && body.type !== "html") {
      return NextResponse.json({ error: "Invalid type. Must be 'image' or 'html'" }, { status: 400 });
    }

    const result = await importBannerWithAI(body);
    
    return NextResponse.json({ elements: result });
  } catch (error: any) {
    console.error("AI Import Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process import" }, { status: 500 });
  }
}
