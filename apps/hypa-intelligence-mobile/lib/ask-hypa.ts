/**
 * Ask Hypa decisions shared by the app and the keyboard tests.
 * The iOS and Android keyboards mirror these rules in native code.
 */

export const ASK_HYPA_PROMPT_LIMIT = 300;
export const ASK_HYPA_CONTEXT_LIMIT = 5_000;
export const ASK_HYPA_RECORD_MS = 30_000;
export const ASK_HYPA_ENDPOINT = '/v2/agent';

export type AskHypaAction = 'replace' | 'insert' | 'show';

const TOOL_STATUS: Record<string, string> = {
  speech_to_text: 'Transcribing…',
  translate_message: 'Translating…',
  text_to_speech: 'Speaking…',
  look_up_term: 'Looking up…',
  extract_text_from_image: 'Reading…',
  current_time: 'Checking the time…',
  weather: 'Checking the weather…',
  web_search: 'Searching the web…',
};

export function clipAskPrompt(text: string): string {
  return text.slice(0, ASK_HYPA_PROMPT_LIMIT);
}

/** The text the prompt would edit: the selection when there is one, otherwise the field. */
export function askContextText(document: string, selected: string): string {
  return selected.length > 0 ? selected : document;
}

export function askContextTooLong(document: string, selected: string): boolean {
  return askContextText(document, selected).length > ASK_HYPA_CONTEXT_LIMIT;
}

export function askToolStatus(name: string): string {
  return TOOL_STATUS[name] ?? 'Working…';
}

export function askFailedToolMessage(name: string, error?: string): string {
  const detail = error?.trim();
  if (detail) return detail;
  if (name === 'text_to_speech') return "Couldn't create the audio.";
  return 'Something went wrong.';
}

export function askAction(value: unknown): AskHypaAction {
  if (value === 'replace' || value === 'insert' || value === 'show') return value;
  return 'show';
}

/**
 * A live replace or insert requires an explicit Insert tap and an unchanged snapshot.
 * A recovered result is never applied.
 */
export function shouldApplyAskEdit(input: {
  confirmed: boolean;
  action: AskHypaAction;
  recovered: boolean;
  generation: number;
  snapshotGeneration: number;
  document: string;
  snapshotDocument: string;
  selected: string;
  snapshotSelected: string;
  selectionStart: number;
  selectionEnd: number;
  snapshotStart: number;
  snapshotEnd: number;
}): boolean {
  if (!input.confirmed || input.recovered || input.action === 'show') return false;
  if (input.generation !== input.snapshotGeneration) return false;
  if (input.snapshotSelected.length > 0) {
    return (
      input.selected === input.snapshotSelected &&
      input.selectionStart === input.snapshotStart &&
      input.selectionEnd === input.snapshotEnd
    );
  }
  return input.selected.length === 0 && input.document === input.snapshotDocument;
}
