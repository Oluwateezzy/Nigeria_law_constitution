export type CatalogueInstrument = {
  id: string;
  kind: 'constitution' | 'act';
  shortTitle: string;
  versionLabel: string;
  year: number;
  extent: string;
  reviewStatus: 'draft' | 'reviewed';
};

export function actRowDetail(item: {
  year: number;
  extent: string;
  reviewStatus: 'draft' | 'reviewed';
}): string {
  const badge = item.reviewStatus === 'reviewed' ? '' : ' Not yet reviewed.';
  return `${item.year}. ${item.extent}${badge}`;
}

export function catalogueRows(input: {
  instruments: readonly CatalogueInstrument[];
  registry: readonly { id: string; shipping: boolean }[];
}): { constitutions: CatalogueInstrument[]; acts: CatalogueInstrument[] } {
  const shipping = new Set(
    input.registry.filter((entry) => entry.shipping).map((entry) => entry.id),
  );
  const rows = input.instruments.filter((instrument) =>
    shipping.has(instrument.id),
  );
  return {
    constitutions: rows.filter(
      (instrument) => instrument.kind === 'constitution',
    ),
    acts: rows.filter((instrument) => instrument.kind === 'act'),
  };
}

export function continueSectionLabel(
  section: { number: string; heading?: string } | null,
  sectionId: string,
): string {
  if (!section) {
    return sectionId;
  }
  if (
    section.heading &&
    section.heading.toLowerCase() !== section.number.toLowerCase()
  ) {
    return `${section.number}. ${section.heading}`;
  }
  return section.heading ?? section.number;
}
