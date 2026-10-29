import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { generateSlides, getSlideDecks, type GenerateSlidesInput } from "@/lib/domain/slides";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const orgId = user.orgId;
    const decks = await getSlideDecks(orgId);
    return NextResponse.json({ decks });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body: GenerateSlidesInput = await req.json();

    if (!body.topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const input: GenerateSlidesInput = {
      topic: body.topic,
      audience: body.audience ?? "engineers",
      slideCount: body.slideCount ?? 7,
      includeDiagrams: body.includeDiagrams ?? true,
      includeCode: body.includeCode ?? true,
      orgId: user.orgId,
      userId: user.id,
    };

    const deck = await generateSlides(input);
    return NextResponse.json({ deck });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate slides";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
