export type LegalBlock = {
  type:
    | 'subsection'
    | 'paragraph'
    | 'subparagraph'
    | 'proviso'
    | 'paragraph_text'
    | 'table';
  marker: string;
  anchor: string;
  text: string;
  blocks?: LegalBlock[];
  rows?: string[][];
};

/** Collapse internal whitespace and keep the words in order. Citation checks use this same function. */
export function normaliseLegalWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function renderBlock(block: LegalBlock): string {
  if (block.type === 'table') {
    const rows = (block.rows ?? []).map((row) =>
      row.map((cell) => normaliseLegalWhitespace(cell)).join(' | '),
    );
    const caption = block.text ? normaliseLegalWhitespace(block.text) : '';
    return normaliseLegalWhitespace(
      [caption, rows.join(' ')].filter(Boolean).join(' '),
    );
  }

  const children = (block.blocks ?? [])
    .map(renderBlock)
    .filter(Boolean)
    .join(' ');
  if (block.type === 'proviso' || block.type === 'paragraph_text') {
    return normaliseLegalWhitespace(
      [block.text ? normaliseLegalWhitespace(block.text) : '', children]
        .filter(Boolean)
        .join(' '),
    );
  }

  const marker = block.marker ? `(${block.marker})` : '';
  const text = block.text ? normaliseLegalWhitespace(block.text) : '';
  const head = [marker, text].filter(Boolean).join(' ');
  return normaliseLegalWhitespace([head, children].filter(Boolean).join(' '));
}

export function derivePlainText(blocks: readonly LegalBlock[]): string {
  return normaliseLegalWhitespace(
    blocks.map(renderBlock).filter(Boolean).join(' '),
  );
}
