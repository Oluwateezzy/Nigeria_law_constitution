# Ingest an instrument

This is the only approved way to add an instrument. There is no import script that skips provenance. A file copied in from memory, or from a source whose reuse is unclear, stays out of the production bundle.

The production bundle is `shippingInstruments()` in `src/load.ts`. It includes an instrument only when `registry.json` has `"shipping": true` for that id and the corpus check passes. An id is stable once it is added to the registry.

## Procedure

1. Pick the source. Record the name, URL, retrieval date, and reuse note in `sources/<id>-provenance.json`. Use the consolidation the popular name refers to. If the source is a different instrument, keep the registry id and record the substitution in `registry.json` under `hold` until the right text is encoded. Do not use an annotated edition.

2. Record reuse before encoding. If the licence or the reuse note is unclear, stop. Leave `shipping` false. Do not copy the text in.

3. Outline the instrument against the source table of contents. Save `sources/<id>-outline.json` with the same shape as `sources/cfrn-1999-outline.json`. Section counts and headings come from that table and the body, not from memory.

4. Encode the official words into `corpus/<id>.js`, one section at a time, using the existing block types. `plainText` is derived from the blocks. Do not paraphrase, correct, or add commentary. Cross-references point only at sections that exist in the encoded instrument.

5. Run CI (`pnpm test` from the repository root, with Node 24). The corpus check runs on every registry id. A shipping id needs a corpus file, provenance, a non-empty extent, and `review.status` of `reviewed`. An Act with an empty extent cannot be reviewed. A draft id must be absent from the production bundle.

6. Complete Appendix A for that Act at `sources/<id>-review.md`, using `sources/cfrn-1999-review.md` as the form. For a limited extent, the appendix records the sentence in the source and the sentence encoded on the instrument. The Criminal Code Act, the Penal Code instrument if it is included, the Administration of Criminal Justice Act, and the Violence Against Persons (Prohibition) Act each need that comparison in the appendix.

7. Set `review.status` to `reviewed`, with `reviewer` and `reviewedOn`, only after every Appendix A row is true. Then set `shipping` to `true` and add the corpus module to `shippingInstruments()`.

8. Add aliases in `src/aliases.json` only for phrases that appear in the instrument. An alias points at a real section id.

9. Add at least three search fixtures that name the Act and return the encoded section, and one scenario fixture whose required id is a section of that Act. A limited extent must appear in the scenario prompt fixture.

## Stop

Stop at draft, with `shipping` false and no corpus file in the production bundle, when any of these are true:

- The source text is not in the repo.
- Reuse is unclear.
- Extent is empty or was not compared with the source.
- Appendix A is incomplete.

The Penal Code popular name stays out when the sourced text is not a federal Act that belongs in this app. Record that reason on the registry entry.
