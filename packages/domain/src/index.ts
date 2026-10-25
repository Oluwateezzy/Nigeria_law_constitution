export { NotImplemented } from './not-implemented';
export { lagosDay } from './lagos-day';
export { parseQuery } from './parse-query';
export type { ParsedQuery } from './parse-query';
export { citationRemovedLimit, validateCitations } from './validate-citations';
export type {
  AllowedSection,
  Citation,
  ValidatedCitations,
} from './validate-citations';
export {
  assemblePrompt,
  illustrationRequired,
  provisionHistoryLimit,
  provisionStarters,
} from './assemble-prompt';
export type {
  AssemblePromptInput,
  AssembledPrompt,
  ChatMessage,
  PromptSection,
} from './assemble-prompt';
export { parseModelPayload } from './model-payload';
export type { ModelAnswer } from './model-payload';
export {
  countsAsRequest,
  freeHostedLimit,
  ipHostedLimit,
  lagosResetsAt,
  limitForLane,
  plusHostedLimit,
  QuotaBook,
} from './quota';
export {
  entitlementActive,
  plusOffer,
  proxyLimit,
  resolveProxyLane,
  rowsFromRevenueCatEvent,
  rowsFromStripeEvent,
  shouldAliasPurchase,
} from './entitlement';
export type { EntitlementRow, EntitlementUpdate } from './entitlement';
export type { QuotaLane, QuotaSnapshot, QuotaSubject } from './quota';
export {
  completeHostedProvision,
  completeHostedScenario,
  retryHostedProvision,
} from './hosted-complete';
export type { ScenarioRequest } from './hosted-complete';
export {
  retrieveScenario,
  scenarioConfidenceThreshold,
  scenarioFactLimit,
  scenarioMatchTokens,
  scenarioMinimumTokens,
  scenarioRetrievalCap,
  scenarioSectionWindow,
  windowSectionText,
} from './retrieve';
export type { ScenarioCandidate, ScenarioRetrieval } from './retrieve';
export type {
  HostedErrorCode,
  HostedRequest,
  HostedResult,
  LoadedSection,
  ModelProvider,
  ProxyLog,
} from './hosted-complete';
export {
  hostedModelId,
  hostedVendor,
  ownKeyHeaders,
  ownKeyProbes,
} from './own-key';
export type { OwnKeyProbe, OwnKeyProvider } from './own-key';
export { mergeByUpdatedAt } from './merge';
export type { Timestamped } from './merge';
export { derivePlainText, normaliseLegalWhitespace } from './plain-text';
export type { LegalBlock } from './plain-text';
export { extractSectionMentions } from './mentions';
export {
  indexHash,
  legalTextHash,
  makeContentVersion,
} from './content-version';
export type { HashSection } from './content-version';
export { sha256 } from './sha256';
export { sanitiseCrash } from './crash';
export { parseSectionJump } from './section-jump';
export type { SectionJump } from './section-jump';
export { MoveGate, elapsedNow, stepIndex, swipeDelta } from './reader-nav';
