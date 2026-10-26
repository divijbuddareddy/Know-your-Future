import rawKnowledgeData from './knowledge-data.json' with { type: 'json' };

export interface KnowledgeChunk {
  heading: string;
  content: string;
  charCount: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  description: string;
  rawLength: number;
  chunks: KnowledgeChunk[];
}

export interface SearchResult {
  docId: string;
  docTitle: string;
  category: string;
  heading: string;
  content: string;
  score: number;
}

const documents: KnowledgeDocument[] = rawKnowledgeData as KnowledgeDocument[];

export function getAllDocuments(): Omit<KnowledgeDocument, 'chunks'>[] {
  return documents.map(d => ({
    id: d.id,
    title: d.title,
    category: d.category,
    durationMinutes: d.durationMinutes,
    description: d.description,
    rawLength: d.rawLength
  }));
}

export function getDocumentById(id: string): KnowledgeDocument | undefined {
  return documents.find(d => d.id === id);
}

export function searchKnowledge(query: string, maxResults = 4): SearchResult[] {
  if (!query || query.trim().length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  const results: SearchResult[] = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const headingLower = chunk.heading.toLowerCase();
      const contentLower = chunk.content.toLowerCase();
      let score = 0;

      for (const term of queryTerms) {
        if (headingLower.includes(term)) {
          score += 15;
        }
        const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(occurrences * 2, 20);
      }

      // Bonus for topic alignment
      if (lowerQuery.includes('marriage') || lowerQuery.includes('spouse') || lowerQuery.includes('relationship')) {
        if (headingLower.includes('marriage') || headingLower.includes('relationship') || headingLower.includes('7th')) score += 25;
      }
      if (lowerQuery.includes('career') || lowerQuery.includes('job') || lowerQuery.includes('profession') || lowerQuery.includes('business')) {
        if (headingLower.includes('career') || headingLower.includes('business') || headingLower.includes('profession')) score += 25;
      }
      if (lowerQuery.includes('health') || lowerQuery.includes('medical') || lowerQuery.includes('disease')) {
        if (headingLower.includes('health') || headingLower.includes('medical') || headingLower.includes('disease')) score += 25;
      }
      if (lowerQuery.includes('month') || lowerQuery.includes('transit')) {
        if (doc.id === 'monthly_report') score += 30;
      }
      if (lowerQuery.includes('transformation') || lowerQuery.includes('120') || lowerQuery.includes('master life report')) {
        if (doc.id.includes('transformation') || doc.id.includes('exploration')) score += 30;
      }

      if (score > 5) {
        results.push({
          docId: doc.id,
          docTitle: doc.title,
          category: doc.category,
          heading: chunk.heading,
          content: chunk.content,
          score
        });
      }
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

export function formatRetrievedContext(results: SearchResult[]): string {
  if (results.length === 0) return '';

  return `\n<verified_client_knowledge_excerpts>\n` +
    results.map((r, i) =>
      `[Source ${i + 1}: ${r.docTitle} | Section: ${r.heading}]\n${r.content}`
    ).join('\n\n---\n\n') +
    `\n</verified_client_knowledge_excerpts>\n`;
}

export function getCanonicalTemplate(templateId: string): string {
  const doc = documents.find(d => d.id === templateId);
  if (!doc) return '';
  return doc.chunks.map(c => `### ${c.heading}\n${c.content}`).join('\n\n');
}
