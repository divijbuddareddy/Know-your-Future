import { NextRequest, NextResponse } from 'next/server';
import { listConversations, createConversation } from '@/lib/db/store.ts';

export async function GET() {
  try {
    const convs = listConversations();
    return NextResponse.json({ conversations: convs });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newConv = createConversation(body.title || 'New Consultation');
    return NextResponse.json({ conversation: newConv }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
