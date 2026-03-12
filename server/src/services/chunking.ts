export interface Chunk {
  text: string;
  index: number;
  count: number;
}

function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    const char = text[i];

    // Sentence boundary: . ! ? followed by space or end of text
    if (char === '.' || char === '!' || char === '?') {
      const next = i + 1 < text.length ? text[i + 1] : ' ';
      if (next === ' ' || next === '\n' || next === '\r' || i + 1 === text.length) {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          sentences.push(trimmed);
        }
        current = '';
      }
    }
  }

  const leftover = current.trim();
  if (leftover.length > 0) {
    sentences.push(leftover);
  }

  return sentences;
}

function splitParagraphs(text: string): string[] {
  const parts = text.split('\n\n');
  const paragraphs: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 0) {
      paragraphs.push(trimmed);
    }
  }

  return paragraphs;
}

function lastSentence(text: string): string {
  const sentences = splitSentences(text);
  return sentences.length > 0 ? sentences[sentences.length - 1] : '';
}

function firstSentence(text: string): string {
  const sentences = splitSentences(text);
  return sentences.length > 0 ? sentences[0] : '';
}

export function chunkByParagraph(text: string, maxChunkSize = 1000): Chunk[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return [];

  const rawChunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    // If a single paragraph exceeds max, break it by sentences
    if (para.length > maxChunkSize) {
      if (current.trim().length > 0) {
        rawChunks.push(current.trim());
        current = '';
      }
      const sentenceChunks = chunkBySentence(para, maxChunkSize);
      for (const sc of sentenceChunks) {
        rawChunks.push(sc.text);
      }
      continue;
    }

    const combined = current.length > 0 ? current + '\n\n' + para : para;
    if (combined.length > maxChunkSize && current.trim().length > 0) {
      rawChunks.push(current.trim());
      current = para;
    } else {
      current = combined;
    }
  }

  if (current.trim().length > 0) {
    rawChunks.push(current.trim());
  }

  // Add overlap: prepend last sentence of previous chunk
  const count = rawChunks.length;
  return rawChunks.map((text, index) => {
    let finalText = text;
    if (index > 0) {
      const overlap = lastSentence(rawChunks[index - 1]);
      if (overlap.length > 0 && overlap.length < 200) {
        finalText = overlap + ' ' + text;
      }
    }
    return { text: finalText, index, count };
  });
}

export function chunkBySentence(text: string, maxChunkSize = 500): Chunk[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  const rawChunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const combined = current.length > 0 ? current + ' ' + sentence : sentence;
    if (combined.length > maxChunkSize && current.length > 0) {
      rawChunks.push(current);
      current = sentence;
    } else {
      current = combined;
    }
  }

  if (current.length > 0) {
    rawChunks.push(current);
  }

  // Add overlap: prepend last sentence of previous chunk
  const count = rawChunks.length;
  return rawChunks.map((text, index) => {
    let finalText = text;
    if (index > 0) {
      const overlap = lastSentence(rawChunks[index - 1]);
      if (overlap.length > 0 && overlap.length < 200 && !text.startsWith(overlap)) {
        finalText = overlap + ' ' + text;
      }
    }
    return { text: finalText, index, count };
  });
}

export function chunkText(text: string, maxChunkSize = 1000): Chunk[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  // Short texts: single chunk
  if (trimmed.length <= maxChunkSize) {
    return [{ text: trimmed, index: 0, count: 1 }];
  }

  // Try paragraph chunking first
  const chunks = chunkByParagraph(trimmed, maxChunkSize);

  // If all chunks are still too large, fall back to sentence chunking
  const allFit = chunks.every((c) => c.text.length <= maxChunkSize * 1.5);
  if (!allFit) {
    return chunkBySentence(trimmed, Math.floor(maxChunkSize / 2));
  }

  return chunks;
}
