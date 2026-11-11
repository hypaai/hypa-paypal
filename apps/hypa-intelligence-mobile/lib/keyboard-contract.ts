import { resolveDictionaryModelName } from '@/lib/dictionary-model';
import { resolveProviderModelForGroup } from '@/lib/model-languages';

export const KEYBOARD_ENDPOINTS = {
  translate: '/v2/translate/mt',
  translateThinking: '/v2/translate/mt/thinking',
  dictionary: '/dictionary',
  dictionaryTts: '/dictionary/tts',
  tts: '/v2/translate/tts',
  stt: '/v2/translate/stt',
  agent: '/v2/agent',
} as const;

export const KEYBOARD_DICTIONARY_TTS_DEFAULTS = {
  maxNewTokens: 2048,
} as const;

export const KEYBOARD_SECTION_TITLES = {
  word: 'Word',
  definition: 'Definition',
  usageExamples: 'Usage Examples',
  synonyms: 'Synonyms',
  antonyms: 'Antonyms',
  culturalContext: 'Cultural Context',
  funFact: 'Fun Fact',
  thinking: 'Thinking',
} as const;



export function buildKeyboardDictionaryLookupPayload(params: {
  word: string;
  language: string;
  model?: string;
  provider?: string;
}) {
  const ac = resolveProviderModelForGroup(
    'AC',
    params.provider,
    resolveDictionaryModelName(params.model)
  );

  return {
    word: params.word,
    language: params.language,
    provider: ac.provider,
    model_name: ac.model,
  };
}

export function buildKeyboardDictionaryTtsPayload(params: {
  text: string;
  language: string;
  voice?: string;
  provider?: string;
  model?: string;
}) {
  const tts = resolveProviderModelForGroup('TTS', params.provider, params.model);

  return {
    text: params.text,
    voice: params.voice,
    preset: {
      provider: tts.provider,
      model: tts.model,
      language: params.language,
      max_new_tokens: KEYBOARD_DICTIONARY_TTS_DEFAULTS.maxNewTokens,
    },
  };
}
