import { NotImplemented } from './not-implemented';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type PromptSection = {
  id: string;
  plainText: string;
  path: string;
  citation: string;
  extent: string;
};

export type AssemblePromptInput = {
  kind: 'provision' | 'scenario';
  messages: readonly ChatMessage[];
  section?: PromptSection;
  retrieved?: readonly PromptSection[];
};

export type AssembledPrompt = {
  system: string;
  messages: ChatMessage[];
};

export function assemblePrompt(input: AssemblePromptInput): AssembledPrompt {
  void input;
  throw new NotImplemented('assemblePrompt');
}
