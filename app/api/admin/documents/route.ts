import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/rag/knowledge-store.ts';

export async function GET() {
  try {
    const docs = getAllDocuments();
    return NextResponse.json({
      documents: docs,
      totalIndexed: docs.length,
      status: 'healthy'
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}
