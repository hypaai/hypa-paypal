import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  PRODUCT_MODEL_OPTIONS_BY_CAPABILITY,
  PRODUCT_MODELS_BY_CAPABILITY,
  type ModelCapability,
} from "@hypa/config/models";
import { supportsMtPair } from "@hypa/config/mt-pair-support";
import { canonicalLanguage, LANGUAGES, resolveLanguage } from "./catalog.ts";

export const AUTO_CAPABILITIES: ReadonlySet<ModelCapability> = new Set(["MT", "TTS", "ASR"]);
const OCR_PROVIDERS = new Set(["openai", "meta"]);

export function toolModelChoices(capability: ModelCapability): string[] {
  return Object.entries(PRODUCT_MODELS_BY_CAPABILITY[capability])
    .filter(([provider]) => capability !== "OCR" || OCR_PROVIDERS.has(provider))
    .flatMap(([provider, models]) => models.map((model) => `${provider}/${model.name}`));
}

/**
 * A tool that failed after some of its work finished. `stage` names the step
 * that failed and `partialResult` keeps what the earlier steps produced, so the
 * caller can reuse it instead of paying for it again.
 */
export class ToolFailure extends Error {
  readonly stage: string;
  readonly partialResult?: Record<string, unknown>;
  readonly code?: string;
  constructor(
    message: string,
    stage: string,
    partialResult?: Record<string, unknown>,
    options?: { cause?: unknown; code?: string },
  ) {
    super(message, options);
    this.name = "ToolFailure";
    this.stage = stage;
    this.partialResult = partialResult;
    this.code = options?.code;
  }
}

/** What a failed tool reports, the same for the agent and for /v2/mcp. */
export function toolFailureBody(error: unknown): { error: string; code?: string; stage?: string; partialResult?: Record<string, unknown> } {
  const message = error instanceof Error && error.message ? error.message : "Tool failed";
  return error instanceof ToolFailure
    ? { error: message, ...(error.code ? { code: error.code } : {}), stage: error.stage, ...(error.partialResult ? { partialResult: error.partialResult } : {}) }
    : { error: message };
}

const MODEL_HELP =
  'Optional. Omit or "auto" for the best-scoring model for the language (with fallback), "default" for the catalog default, or a "provider/model" id from list_models.';

const modelField = (step?: string) =>
  z
    .string()
    .max(200)
    .optional()
    .describe(step ? `${MODEL_HELP} Applies to the ${step} step.` : MODEL_HELP);

export interface RanOn {
  provider?: string;
  model?: string;
}

export interface HypaExecutor {
  translate(input: {
    text: string;
    targetLang: string;
    sourceLang?: string;
    model?: string;
  }): Promise<{ translation: string; language: string | null } & RanOn>;
  speak(input: {
    text: string;
    language: string;
    voice?: string;
    model?: string;
  }): Promise<{ audioBase64: string; mime: string; sampleRate?: number; voice?: string } & RanOn>;
  transcribe(input: {
    audio: string;
    audioType?: "base64" | "url";
    sourceLang?: string;
    model?: string;
  }): Promise<{ transcript: string } & RanOn>;
  lookUp(input: { word: string; language?: string }): Promise<{ result: Record<string, unknown> } & RanOn>;
  readImage(input: {
    image: string;
    imageType?: "base64" | "url";
    model?: string;
  }): Promise<{ text: string } & RanOn>;
  wordOfTheDay(): Promise<WordOfTheDay | null>;
  createOrder(input: {
    customerName: string;
    customerContact: string;
    customerLanguage?: string;
    amount: string;
    currency: string;
    items: { name: string; qty: number; unitPrice: string }[];
    merchantLanguage?: string;
  }): Promise<{
    orderId: string;
    amount: string;
    currency: string;
    status: string;
    approvalUrl: string;
    approval?: import('./agent-stream.ts').PaymentApproval;
  }>;
  listPaymentMethods(input: { country: string; currency: string }): Promise<{ methods: { id: string; name: string }[] }>;
  createCheckout(input: { orderId: string }): Promise<{
    orderId: string;
    checkoutUrl: string;
    amount: string;
    currency: string;
    customerLanguage: string | null;
    merchantLanguage: string | null;
  }>;
  getPaymentStatus(input: { orderId: string }): Promise<{ orderId: string; orderStatus: string; paymentStatus: string | null }>;
}

export interface WordOfTheDay {
  word: string;
  meaning: string;
  language: string;
  voice: string;
  audioUrl?: string;
}

const language = (hint: string) =>
  z
    .string()
    .min(1)
    .max(40)
    .describe(
      `${hint} A Hypa language label, e.g. "English", "Yoruba", "Hausa", "Igbo", "French". Check list_languages when unsure.`,
    );

const text = (max: number, hint: string) => z.string().min(1).max(max).describe(hint);

const paymentItem = z.object({
  name: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(1000),
  unitPrice: z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/),
});

function checkLanguagePair(sourceLabel: string | undefined, targetLabel: string) {
  const source = sourceLabel ? resolveLanguage(sourceLabel) : undefined;
  const target = resolveLanguage(targetLabel);
  const unknown = [sourceLabel && !source ? sourceLabel : "", target ? "" : targetLabel].filter(Boolean);
  if (unknown.length || !target) return { supported: false, models: [], unknown };
  const runnable = new Set(toolModelChoices("MT"));
  const models = Object.entries(PRODUCT_MODEL_OPTIONS_BY_CAPABILITY.MT).flatMap(([provider, options]) =>
    options
      .filter((option) =>
        option.languageCodes.includes(target.code) &&
        (!source || option.languageCodes.includes(source.code)) &&
        supportsMtPair(provider, source?.name ?? null, target.name),
      )
      .map((option) => `${provider}/${option.name}`)
      .filter((id) => runnable.has(id)),
  );
  return { supported: models.length > 0, models };
}

const audio = z
  .string()
  .min(1)
  .max(20_000_000)
  .describe("Base64-encoded audio, or an https URL when audioType is 'url'.");

/** In a chat the model names an attached recording by number instead of passing the bytes. */
const attachedAudio = z.coerce
  .number()
  .int()
  .min(1)
  .max(8)
  .optional()
  .describe("In a chat only: the number of the voice note or audio file the user attached, in the order given. Do not pass `audio` then.");

const audioRequired = () =>
  new ToolFailure(
    "No audio was given. Pass `audio`, or set attachedAudio to the number of an audio file attached in a chat.",
    "input",
  );

const image = z
  .string()
  .min(1)
  .max(25_000_000)
  .describe("Base64-encoded image, or an https URL when imageType is 'url'. PNG, JPG or WebP.");

const mediaType = (what: string) =>
  z.enum(["base64", "url"]).optional().describe(`How \`${what}\` is given. Defaults to base64.`);

const voice = z
  .string()
  .max(80)
  .optional()
  .describe("Optional voice name for the language. Omit for the model's default voice.");

const ranOn = {
  provider: z.string().optional().describe("Provider that ran the model step."),
  model: z.string().optional().describe("Model that ran (the Auto winner when routed)."),
};

const audioFormat = z
  .enum(["url", "base64"])
  .optional()
  .describe(
    'How the audio comes back. "url" (default): a link to the audio that works for about an hour. "base64": the audio inline, which is very large.',
  );

const speech = {
  audioUrl: z.string().optional().describe("Link to the audio, valid for about an hour."),
  audioBase64: z.string().optional().describe('Base64-encoded audio (only with format "base64").'),
  sampleRate: z.number().optional().describe("Audio sample rate in Hz."),
  voice: z.string().optional().describe("The voice that spoke."),
  mime: z.string().describe("Audio MIME type, such as audio/wav or audio/mpeg."),
};

export interface HypaTool {
  name: string;
  title: string;
  description: string;
  inputSchema: z.AnyZodObject;
  outputSchema: z.AnyZodObject;
  run: (executor: HypaExecutor, args: Record<string, any>) => Promise<object>;
  /**
   * Only the chat attaches files, so these tools take an `attached…` number there.
   * `hint` is added to the description the chat's model reads. `require` lists the inputs
   * that other clients (MCP) must give, since the chat may leave them out.
   */
  chat?: { hint: string; require: readonly string[] };
}

const DOCUMENT_MAX = 20_000;
const CHUNK_MAX = 5_000;

const lang = (value?: string) => (value ? canonicalLanguage(value) : undefined);
const voiceName = (value?: string) => (value && value.toLowerCase() !== "auto" ? value : undefined);

// --- payments -----------------------------------------------------------------

/**
 * The payment steps. They are published as one tool, `paypal`, so a client
 * enables payments once and gets all five: `action` picks the step, and each
 * step still validates and runs on its own schema.
 */
interface PaymentAction {
  inputSchema: z.AnyZodObject;
  outputSchema: z.AnyZodObject;
  /** `args` is whatever `inputSchema` parsed, so each step reads its own fields. */
  run: (executor: HypaExecutor, args: any) => Promise<object>;
}

const PAYMENT_ACTION_NAMES = [
  "create_order",
  "list_payment_methods",
  "create_checkout",
  "get_payment_status",
  "send_payment_link",
] as const;

type PaymentActionName = (typeof PAYMENT_ACTION_NAMES)[number];

const orderId = z.string().min(1).describe("Id of the order, from create_order.");
const currency = z.string().regex(/^[A-Za-z]{3}$/).describe('ISO 4217 currency code, e.g. "USD".');
const money = z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/);

const PAYMENT_ACTIONS: Record<PaymentActionName, PaymentAction> = {
  create_order: {
    inputSchema: z.object({
      customerName: z.string().min(1).max(200),
      customerContact: z.string().min(1).max(320),
      customerLanguage: language(
        "Customer's catalog language code or name, used for the payment message sent to them. Defaults to the merchant's language when it is not known.",
      ).optional(),
      amount: money,
      currency,
      items: z.array(paymentItem).min(1).max(100),
      merchantLanguage: language(
        "Merchant's catalog language code or name: the language the merchant is writing or speaking to you in, which is what the approval card and the merchant's replies use. Never ask the merchant for it.",
      ).optional(),
    }),
    outputSchema: z.object({
      orderId: z.string(),
      amount: z.string(),
      currency: z.string(),
      status: z.string(),
      approvalUrl: z.string().url(),
    }),
    run: (executor, args) => executor.createOrder(args),
  },
  list_payment_methods: {
    inputSchema: z.object({
      country: z.string().regex(/^[A-Za-z]{2}$/).describe('ISO 3166-1 alpha-2 country code, e.g. "US".'),
      currency,
    }),
    outputSchema: z.object({ methods: z.array(z.object({ id: z.string(), name: z.string() })) }),
    run: (executor, args) => executor.listPaymentMethods(args),
  },
  create_checkout: {
    inputSchema: z.object({ orderId }),
    outputSchema: z.object({ orderId: z.string(), checkoutUrl: z.string().url() }),
    run: async (executor, args) => {
      const checkout = await executor.createCheckout({ orderId: args.orderId });
      return { orderId: checkout.orderId, checkoutUrl: checkout.checkoutUrl };
    },
  },
  get_payment_status: {
    inputSchema: z.object({ orderId }),
    outputSchema: z.object({
      orderId: z.string(),
      orderStatus: z.string(),
      paymentStatus: z.string().nullable(),
    }),
    run: (executor, args) => executor.getPaymentStatus(args),
  },
  send_payment_link: {
    inputSchema: z.object({ orderId }),
    outputSchema: z.object({
      orderId: z.string(),
      checkoutUrl: z.string().url(),
      message: z.string(),
      language: z.string(),
    }),
    run: async (executor, args) => {
      const checkout = await executor.createCheckout({ orderId: args.orderId });
      const customer = checkout.customerLanguage ? resolveLanguage(checkout.customerLanguage) : undefined;
      const merchant = checkout.merchantLanguage ? resolveLanguage(checkout.merchantLanguage) : undefined;
      const english = resolveLanguage("en");
      const requested = customer ?? merchant ?? english;
      const fallback = merchant ?? english;
      let target = requested;
      if (!target || !checkLanguagePair("English", target.name).supported) target = fallback;

      const amountToken = "HYPAPAYAMOUNT7XQ";
      // The link stays out of translation and on its own last line, so chat apps make it tappable.
      const template = `Your order is ready. Please complete payment of ${amountToken} here:`;
      // The checkout already exists, so a translation that fails or loses the amount must not
      // cost the merchant the link: the message falls back to English and says so.
      const translated = async (language: { name: string }) => {
        try {
          const { translation } = await executor.translate({
            text: template,
            sourceLang: "English",
            targetLang: language.name,
          });
          return translation.includes(amountToken) ? translation : undefined;
        } catch {
          return undefined;
        }
      };
      let message = template;
      let written = english;
      if (target && target.code !== "en") {
        const text = await translated(target);
        if (text) {
          message = text;
          written = target;
        } else if (fallback && fallback.code !== "en" && fallback.code !== target.code) {
          const fallbackText = await translated(fallback);
          if (fallbackText) {
            message = fallbackText;
            written = fallback;
          }
        }
      } else {
        written = target ?? english;
      }
      message = `${message.replaceAll(amountToken, `${checkout.amount} ${checkout.currency}`)}\n${checkout.checkoutUrl}`;
      return {
        orderId: checkout.orderId,
        checkoutUrl: checkout.checkoutUrl,
        message,
        language: written?.code ?? "en",
      };
    },
  },
};

/** Every payment field and result, each optional: `action` decides which apply. */
const paymentFields = (key: "inputSchema" | "outputSchema"): z.ZodRawShape =>
  Object.values(PAYMENT_ACTIONS).reduce<z.ZodRawShape>(
    (shape, action) => ({ ...shape, ...action[key].partial().shape }),
    {},
  );

export const HYPA_TOOLS: HypaTool[] = [
  {
    name: "paypal",
    title: "PayPal payments",
    description:
      "PayPal payments, in one tool. `action` picks the step: " +
      '"create_order" (customerName, customerContact, amount, currency, items, optional customerLanguage and merchantLanguage) saves a draft order and returns its merchant approval link — the amount is only a proposal and no checkout can start until the merchant approves it; ' +
      '"list_payment_methods" (country, currency) lists the payment methods available there; ' +
      '"create_checkout" (orderId) creates the provider checkout for an approved order; ' +
      '"get_payment_status" (orderId) reads the order and payment status; ' +
      '"send_payment_link" (orderId) returns the checkout link and a short payment message in the customer\'s language. ' +
      "Only the fields the action lists are read; the rest are ignored.",
    inputSchema: z.object({
      action: z.enum(PAYMENT_ACTION_NAMES).describe("Which payment step to run."),
      ...paymentFields("inputSchema"),
    }),
    outputSchema: z.object(paymentFields("outputSchema")),
    run: (executor, args) => {
      const action = PAYMENT_ACTIONS[args.action as PaymentActionName];
      const { action: _action, ...rest } = args;
      return action.run(executor, action.inputSchema.parse(rest));
    },
  },
  {
    name: "translate_message",
    title: "Translate a message",
    description:
      "Translate text into another language. Keep numbers, doses and prices exactly as written.",
    inputSchema: z.object({
      text: text(5000, "The text to translate."),
      sourceLang: language("The language of the text. Omit to auto-detect.").optional(),
      targetLang: language("The language to translate into."),
      model: modelField(),
    }),
    outputSchema: z.object({
      translation: z.string(),
      language: z.string().nullable().describe("The detected source language, when auto-detected."),
      ...ranOn,
    }),
    run: (executor, args) =>
      executor.translate({
        text: args.text,
        sourceLang: lang(args.sourceLang),
        targetLang: canonicalLanguage(args.targetLang),
        model: args.model,
      }),
  },
  {
    name: "translate_document",
    title: "Translate a long document",
    description:
      "Translate a long text (up to 20,000 characters) in chunks, keeping its paragraphs. Use translate_message for anything under 5,000 characters.",
    inputSchema: z.object({
      text: text(DOCUMENT_MAX, "The document to translate."),
      sourceLang: language("The language of the document. Omit to auto-detect.").optional(),
      targetLang: language("The language to translate into."),
      model: modelField(),
    }),
    outputSchema: z.object({
      translation: z.string(),
      language: z.string().nullable().describe("The detected source language, when auto-detected."),
      chunks: z.number().describe("How many pieces the document was translated in."),
      ...ranOn,
    }),
    run: async (executor, args) => {
      const sourceLang = lang(args.sourceLang);
      const targetLang = canonicalLanguage(args.targetLang);
      const chunks = documentChunks(args.text);
      const done = await Promise.all(
        chunks.map((chunk) =>
          executor.translate({ text: chunk.trim(), sourceLang, targetLang, model: args.model }),
        ),
      );
      const translation = done
        .map((part, index) => part.translation.trim() + (chunks[index].match(/\s*$/)?.[0] ?? ""))
        .join("")
        .trimEnd();
      const sameModel = done.every((part) => part.provider === done[0].provider && part.model === done[0].model);
      return {
        translation,
        language: done[0].language,
        chunks: chunks.length,
        ...(sameModel ? ranOnOf(done[0]) : {}),
      };
    },
  },
  {
    name: "translate_and_speak",
    title: "Translate and speak aloud",
    description: "Translate text and speak the translation.",
    inputSchema: z.object({
      text: text(5000, "The text to translate and speak."),
      sourceLang: language("The language of the text. Omit to auto-detect.").optional(),
      targetLang: language("The language to translate into and speak."),
      voice,
      format: audioFormat,
      model: modelField("translation"),
      speechModel: modelField("speech"),
    }),
    outputSchema: z.object({ translatedText: z.string(), ...speech, ...ranOn }),
    run: async (executor, args) => {
      const targetLang = canonicalLanguage(args.targetLang);
      const translated = await executor.translate({
        text: args.text,
        sourceLang: lang(args.sourceLang),
        targetLang,
        model: args.model,
      });
      const spoken = await executor.speak({
        text: translated.translation,
        language: targetLang,
        voice: voiceName(args.voice),
        model: args.speechModel,
      });
      return { translatedText: translated.translation, ...spoken };
    },
  },
  {
    name: "look_up_term",
    title: "Look up a word",
    description: "Look up a word or short phrase: meanings, usage, similar and opposite words, and cultural context.",
    inputSchema: z.object({
      word: text(120, "The word or phrase to look up."),
      language: language("The language of the word. Omit for English.").optional(),
    }),
    outputSchema: z.object({ result: z.record(z.unknown()), ...ranOn }),
    run: (executor, args) => executor.lookUp({ word: args.word, language: lang(args.language) }),
  },
  {
    name: "text_to_speech",
    title: "Speak text aloud",
    description:
      "Speak text aloud in its language (audio), without translating it. " +
      "To use speech in code, call POST https://api.hypaintelligence.com/v2/developer/tts with the key in an `x-api-key` header " +
      "(not `Authorization: Bearer`) and JSON `{provider, model, voice, text, language}`, using the provider, model and voice this tool returns. " +
      "The reply is JSON: `response.audio_b64` is the audio (base64) and `response.audio_type` its type.",
    inputSchema: z.object({
      text: text(5000, "The text to speak."),
      language: language("The language of the text, which is the language it is spoken in."),
      voice,
      format: audioFormat,
      model: modelField(),
    }),
    outputSchema: z.object({ ...speech, ...ranOn }),
    run: async (executor, args) =>
      executor.speak({
        text: args.text,
        language: canonicalLanguage(args.language),
        voice: voiceName(args.voice),
        model: args.model,
      }),
  },
  {
    name: "speech_to_text",
    title: "Transcribe speech",
    description: "Transcribe a voice recording into text.",
    chat: {
      hint: "To hear audio the user attached to the chat, set attachedAudio to its number (1 for the first) instead of passing `audio`; for several files, call this once per file.",
      require: ["audio"],
    },
    inputSchema: z.object({
      audio: audio.optional(),
      audioType: mediaType("audio"),
      attachedAudio,
      sourceLang: language("The language spoken, when known. Helps pick the best model.").optional(),
      model: modelField(),
    }),
    outputSchema: z.object({ transcript: z.string(), ...ranOn }),
    run: (executor, args) => {
      if (!args.audio) throw audioRequired();
      return executor.transcribe({
        audio: args.audio,
        audioType: args.audioType,
        sourceLang: lang(args.sourceLang),
        model: args.model,
      });
    },
  },
  {
    name: "process_voice_message",
    title: "Process a voice message",
    description: "Transcribe a voice message, and translate the transcript when targetLang is given.",
    chat: {
      hint: "To use audio the user attached to the chat, set attachedAudio to its number (1 for the first) instead of passing `audio`.",
      require: ["audio"],
    },
    inputSchema: z.object({
      audio: audio.optional(),
      audioType: mediaType("audio"),
      attachedAudio,
      sourceLang: language("The language spoken. Omit to auto-detect.").optional(),
      targetLang: language("Optionally translate the transcript into this language.").optional(),
      model: modelField("transcription"),
      translationModel: modelField("translation"),
    }),
    outputSchema: z.object({ transcript: z.string(), translatedText: z.string().optional(), ...ranOn }),
    run: async (executor, args) => {
      if (!args.audio) throw audioRequired();
      const sourceLang = lang(args.sourceLang);
      const heard = await executor.transcribe({
        audio: args.audio,
        audioType: args.audioType,
        sourceLang,
        model: args.model,
      });
      const targetLang = lang(args.targetLang);
      if (!targetLang) return heard;
      const translated = await executor.translate({
        text: heard.transcript,
        sourceLang,
        targetLang,
        model: args.translationModel,
      });
      return { transcript: heard.transcript, translatedText: translated.translation, ...ranOnOf(translated) };
    },
  },
  {
    name: "extract_text_from_image",
    title: "Read text from an image",
    description: "Read the text in an image (a sign, menu, label, document or screenshot).",
    inputSchema: z.object({ image, imageType: mediaType("image"), model: modelField() }),
    outputSchema: z.object({ text: z.string(), ...ranOn }),
    run: (executor, args) =>
      executor.readImage({ image: args.image, imageType: args.imageType, model: args.model }),
  },
  {
    name: "translate_image",
    title: "Read and translate an image",
    description: "Read the text in an image, then translate it into another language.",
    inputSchema: z.object({
      image,
      imageType: mediaType("image"),
      sourceLang: language("The language of the text in the image. Omit to auto-detect.").optional(),
      targetLang: language("The language to translate into."),
      model: modelField("reading"),
      translationModel: modelField("translation"),
    }),
    outputSchema: z.object({
      text: z.string(),
      translation: z.string(),
      language: z.string().nullable(),
      ...ranOn,
    }),
    run: async (executor, args) => {
      const read = await executor.readImage({
        image: args.image,
        imageType: args.imageType,
        model: args.model,
      });
      const translated = await executor.translate({
        text: read.text,
        sourceLang: lang(args.sourceLang),
        targetLang: canonicalLanguage(args.targetLang),
        model: args.translationModel,
      });
      return {
        text: read.text,
        translation: translated.translation,
        language: translated.language,
        ...ranOnOf(translated),
      };
    },
  },
  {
    name: "list_voices",
    title: "List voices for a language",
    description:
      "List the voices Hypa has for one language, and the models that can speak it. Use it to pick a valid `voice` for text_to_speech.",
    inputSchema: z.object({
      language: language("The language to list voices for."),
    }),
    outputSchema: z.object({
      language: z.string().optional().describe("Canonical language label."),
      code: z.string().optional().describe("Language code."),
      voices: z.array(z.string()).describe("Voice names to pass as `voice`."),
      models: z.array(z.string()).describe("provider/model ids that can speak this language."),
      unknown: z.boolean().optional().describe("True when Hypa does not know this language."),
    }),
    run: async (_executor, args) => {
      const target = resolveLanguage(args.language);
      if (!target) return { voices: [], models: [], unknown: true };
      const models = Object.entries(PRODUCT_MODEL_OPTIONS_BY_CAPABILITY.TTS).flatMap(([provider, options]) =>
        options
          .filter((option) => option.languageCodes.includes(target.code))
          .map((option) => `${provider}/${option.name}`),
      );
      return { language: target.name, code: target.code, voices: [...target.voices], models };
    },
  },
  {
    name: "word_of_the_day",
    title: "Word of the day",
    description:
      "Today's word in one of Hypa's languages, with its meaning and a recording when there is one. The same word for everyone, and it changes daily.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      available: z.boolean().describe("False before today's word has been made."),
      word: z.string().optional(),
      meaning: z.string().optional(),
      language: z.string().optional(),
      voice: z.string().optional(),
      audioUrl: z.string().optional().describe("Link to a recording of the word."),
    }),
    run: async (executor) => {
      const entry = await executor.wordOfTheDay();
      return entry ? { available: true, ...entry } : { available: false };
    },
  },
  {
    name: "list_languages",
    title: "List languages",
    description: "List every language Hypa supports for translation and speech, with its voices.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      languages: z.array(z.object({ name: z.string(), code: z.string(), voices: z.array(z.string()) })),
    }),
    run: async () => ({
      languages: LANGUAGES.map(({ name, code, voices }) => ({ name, code, voices: [...voices] })),
    }),
  },
  {
    name: "check_language_pair",
    title: "Check a language pair",
    description:
      "Check whether Hypa can translate from one language to another, and which models can. Use it before translating an unusual pair.",
    inputSchema: z.object({
      sourceLang: language("The language to translate from. Omit for auto-detect.").optional(),
      targetLang: language("The language to translate into."),
    }),
    outputSchema: z.object({
      supported: z.boolean(),
      models: z.array(z.string()).describe("provider/model ids that can translate this pair."),
      unknown: z.array(z.string()).optional().describe("Language labels Hypa doesn't know."),
    }),
    run: async (_executor, args) => checkLanguagePair(args.sourceLang, args.targetLang),
  },
  {
    name: "list_models",
    title: "List models",
    description:
      'List the models each kind of tool can run on, for the optional `model` argument. "auto" picks by quality score; "default" uses the catalog default.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      auto: z.array(z.string()).describe("Capabilities that support Auto."),
      models: z.record(z.array(z.string())).describe("provider/model ids per capability."),
    }),
    run: async () => ({
      auto: [...AUTO_CAPABILITIES],
      models: {
        translation: toolModelChoices("MT"),
        speech: toolModelChoices("TTS"),
        transcription: toolModelChoices("ASR"),
        image_reading: toolModelChoices("OCR"),
      },
    }),
  },
];

function documentChunks(text: string): string[] {
  const pieces = text
    .split(/(?<=\n\s*\n)/)
    .flatMap((paragraph) =>
      paragraph.length <= CHUNK_MAX ? [paragraph] : (paragraph.match(/[^.!?。]+[.!?。]*\s*/g) ?? [paragraph]),
    )
    .flatMap((piece) => {
      const parts: string[] = [];
      for (let start = 0; start < piece.length; start += CHUNK_MAX) parts.push(piece.slice(start, start + CHUNK_MAX));
      return parts;
    });
  const chunks: string[] = [];
  for (const piece of pieces) {
    const last = chunks.length - 1;
    if (last >= 0 && chunks[last].length + piece.length <= CHUNK_MAX) chunks[last] += piece;
    else chunks.push(piece);
  }
  return chunks.filter((chunk) => chunk.trim());
}

const ranOnOf = ({ provider, model }: RanOn): RanOn => ({
  ...(provider ? { provider } : {}),
  ...(model ? { model } : {}),
});

export async function runHypaTool(
  tool: HypaTool,
  executor: HypaExecutor,
  args: unknown,
): Promise<Record<string, unknown>> {
  return (await tool.run(executor, tool.inputSchema.parse(args ?? {}))) as Record<string, unknown>;
}

export interface FunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** The same tools as OpenAI-style function tools, for the agent's models. */
export function toFunctionTools(tools: HypaTool[] = HYPA_TOOLS): FunctionTool[] {
  return tools.map((tool) => {
    const { $schema: _schema, ...parameters } = zodToJsonSchema(tool.inputSchema, {
      $refStrategy: "none",
    }) as Record<string, unknown>;
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.chat ? `${tool.description} ${tool.chat.hint}` : tool.description,
        parameters,
      },
    };
  });
}

/** What /v2/mcp publishes: no chat-only `attached…` inputs, and the inputs the chat may skip are required again. */
export function toMcpTool(tool: HypaTool): HypaTool {
  const mask = (keys: readonly string[]) => Object.fromEntries(keys.map((key) => [key, true as const]));
  const attached = Object.keys(tool.inputSchema.shape).filter((key) => key.startsWith("attached"));
  let inputSchema = tool.inputSchema;
  if (attached.length) inputSchema = inputSchema.omit(mask(attached));
  if (tool.chat?.require.length) inputSchema = inputSchema.required(mask(tool.chat.require));
  return { ...tool, inputSchema };
}
