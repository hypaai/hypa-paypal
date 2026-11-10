import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HYPA_TOOLS,
  runHypaTool,
  toFunctionTools,
  toMcpTool,
  ToolFailure,
  toolFailureBody,
  toolModelChoices,
  type HypaExecutor,
} from "../src/tools";

const tool = (name: string) => HYPA_TOOLS.find((entry) => entry.name === name)!;

let todaysWord: { word: string; meaning: string; language: string; voice: string; audioUrl?: string } | null = {
  word: "ụlọ",
  meaning: "house",
  language: "Igbo",
  voice: "Adaora",
  audioUrl: "https://example.com/wotd.wav",
};

/** Records every basic step a tool runs. */
function recordingExecutor(customerLanguage = "yo") {
  const steps: { step: string; input: Record<string, unknown> }[] = [];
  const executor: HypaExecutor = {
    translate: async (input) => {
      steps.push({ step: "translate", input });
      return { translation: `T(${input.text})`, language: "English", provider: "google", model: "gemini" };
    },
    speak: async (input) => {
      steps.push({ step: "speak", input });
      return { audioBase64: "UklG", mime: "audio/mpeg", voice: "Eniola", provider: "hypaai", model: "orpheus" };
    },
    transcribe: async (input) => {
      steps.push({ step: "transcribe", input });
      return { transcript: "hello", provider: "openai", model: "whisper-1" };
    },
    lookUp: async (input) => {
      steps.push({ step: "lookUp", input });
      return { result: { word: input.word } };
    },
    readImage: async (input) => {
      steps.push({ step: "readImage", input });
      return { text: "EXIT", provider: "openai", model: "gpt-4o-mini" };
    },
    wordOfTheDay: async () => {
      steps.push({ step: "wordOfTheDay", input: {} });
      return todaysWord;
    },
    createOrder: async (input) => {
      steps.push({ step: "createOrder", input });
      return {
        orderId: "order-1",
        amount: input.amount,
        currency: input.currency,
        status: "draft",
        approvalUrl: "https://hypaintelligence.com/orders/order-1/approve",
        approval: {
          orderId: "order-1",
          amount: input.amount,
          currency: input.currency,
          fee: { amount: "0.01", currency: "USD" },
          customer: { name: input.customerName, contact: input.customerContact, language: input.customerLanguage ?? null },
          items: input.items,
          merchantLanguage: input.merchantLanguage ?? "en",
        },
      };
    },
    listPaymentMethods: async (input) => {
      steps.push({ step: "listPaymentMethods", input });
      return { methods: [{ id: "paypal", name: "PayPal" }] };
    },
    createCheckout: async (input) => {
      steps.push({ step: "createCheckout", input });
      return {
        orderId: input.orderId,
        checkoutUrl: "https://www.paypal.com/checkout/order-1",
        amount: "12.50",
        currency: "USD",
        customerLanguage,
        merchantLanguage: "en",
      };
    },
    getPaymentStatus: async (input) => {
      steps.push({ step: "getPaymentStatus", input });
      return { orderId: input.orderId, orderStatus: "approved", paymentStatus: "pending" };
    },
  };
  return { executor, steps };
}

describe("Hypa tools", () => {
  it("is the one list, and never offers the keyboard finish step", () => {
    assert.deepEqual(
      HYPA_TOOLS.map((entry) => entry.name),
      [
        "paypal",
        "translate_message",
        "translate_document",
        "translate_and_speak",
        "look_up_term",
        "text_to_speech",
        "speech_to_text",
        "process_voice_message",
        "extract_text_from_image",
        "translate_image",
        "list_voices",
        "word_of_the_day",
        "list_languages",
        "check_language_pair",
        "list_models",
      ],
    );
    assert.equal(HYPA_TOOLS.some((entry) => entry.name === "finish"), false);
  });

  it("publishes plain JSON Schema function tools with the same names", () => {
    const tools = toFunctionTools();
    for (const fn of tools) {
      assert.equal(fn.function.parameters.type, "object");
      assert.equal("$schema" in fn.function.parameters, false);
    }
    assert.deepEqual(tools.map((fn) => fn.function.name), HYPA_TOOLS.map((entry) => entry.name));
    const props = (name: string) =>
      (tools.find((fn) => fn.function.name === name)!.function.parameters as {
        properties: Record<string, unknown>;
      }).properties;
    assert.ok(props("translate_message").model);
    assert.ok(props("speech_to_text").sourceLang);
    assert.equal(props("look_up_term").model, undefined);
  });

  it("creates draft orders from a proposed amount and does not accept a provider override", async () => {
    const { executor, steps } = recordingExecutor();
    const result = await runHypaTool(tool("paypal"), executor, {
      action: "create_order",
      customerName: "Ada",
      customerContact: "ada@example.com",
      amount: "25.00",
      currency: "USD",
      items: [{ name: "Tote", qty: 1, unitPrice: "25.00" }],
      provider: "attacker-provider",
    });
    assert.equal(result.status, "draft");
    assert.equal(steps[0].input.provider, undefined);
  });

  it("lists payment methods by country and currency", async () => {
    const { executor } = recordingExecutor();
    assert.deepEqual(
      await runHypaTool(tool("paypal"), executor, { action: "list_payment_methods", country: "US", currency: "USD" }),
      { methods: [{ id: "paypal", name: "PayPal" }] },
    );
  });

  it("uses only the approved order ID when creating checkout and reading status", async () => {
    const { executor, steps } = recordingExecutor();
    await runHypaTool(tool("paypal"), executor, {
      action: "create_checkout", orderId: "order-1", amount: "0.01", provider: "forged-provider",
    });
    await runHypaTool(tool("paypal"), executor, {
      action: "get_payment_status", orderId: "order-1", provider: "forged-provider",
    });
    assert.deepEqual(steps.map((step) => step.input), [{ orderId: "order-1" }, { orderId: "order-1" }]);
  });

  it("translates payment links while retaining the exact amount and URL", async () => {
    const { executor, steps } = recordingExecutor();
    const result = await runHypaTool(tool("paypal"), executor, { action: "send_payment_link", orderId: "order-1" });
    assert.match(String(result.message), /12\.50 USD/);
    assert.match(String(result.message), /\nhttps:\/\/www\.paypal\.com\/checkout\/order-1$/);
    assert.equal(result.language, "yo");
    assert.ok(steps.some((step) => step.step === "translate"));
  });

  it("prepares customer-language messages for Yoruba, Hausa and French", async () => {
    for (const code of ["yo", "ha", "fr"]) {
      const { executor } = recordingExecutor(code);
      const result = await runHypaTool(tool("paypal"), executor, { action: "send_payment_link", orderId: "order-1" });
      assert.equal(result.language, code);
      assert.match(String(result.message), /12\.50 USD/);
      assert.match(String(result.message), /https:\/\/www\.paypal\.com\/checkout\/order-1/);
    }
  });

  it("validates each payment action against its own schema", async () => {
    const { executor, steps } = recordingExecutor();
    await assert.rejects(
      () => runHypaTool(tool("paypal"), executor, { action: "create_order", customerName: "Ada" }),
    );
    await assert.rejects(() => runHypaTool(tool("paypal"), executor, { action: "refund_order" }));
    assert.deepEqual(steps, []);
  });

  it("builds combos from the basic steps and passes each step its own model", async () => {
    const { executor, steps } = recordingExecutor();
    const result = await runHypaTool(tool("translate_and_speak"), executor, {
      text: "Good morning",
      targetLang: "yoruba",
      model: "default",
      speechModel: "auto",
    });
    assert.deepEqual(steps.map((entry) => entry.step), ["translate", "speak"]);
    assert.equal(steps[0].input.model, "default");
    assert.equal(steps[0].input.targetLang, "Yoruba");
    assert.equal(steps[1].input.model, "auto");
    assert.equal(steps[1].input.text, "T(Good morning)");
    assert.equal(result.translatedText, "T(Good morning)");
    assert.equal(result.mime, "audio/mpeg");
  });

  it("translates a voice message only when a target is given", async () => {
    const { executor, steps } = recordingExecutor();
    await runHypaTool(tool("process_voice_message"), executor, { audio: "AAAA" });
    assert.deepEqual(steps.map((entry) => entry.step), ["transcribe"]);
    await runHypaTool(tool("process_voice_message"), executor, { audio: "AAAA", targetLang: "Hausa" });
    assert.deepEqual(steps.map((entry) => entry.step), ["transcribe", "transcribe", "translate"]);
  });

  it("lets the audio tools take an attached recording by number, and refuses no audio at all", async () => {
    for (const name of ["speech_to_text", "process_voice_message"]) {
      const shape = (tool(name).inputSchema as unknown as { shape: Record<string, unknown> }).shape;
      assert.ok("attachedAudio" in shape, `${name} accepts attachedAudio`);
      const { executor, steps } = recordingExecutor();
      await assert.rejects(runHypaTool(tool(name), executor, {}), /No audio was given/);
      assert.equal(steps.length, 0);
    }
  });

  it("rejects bad arguments before any step runs", async () => {
    const { executor, steps } = recordingExecutor();
    await assert.rejects(runHypaTool(tool("translate_message"), executor, { text: "" }));
    assert.equal(steps.length, 0);
  });

  it("lists models per capability without contributor models", async () => {
    const { executor } = recordingExecutor();
    const listed = (await runHypaTool(tool("list_models"), executor, {})) as {
      auto: string[];
      models: Record<string, string[]>;
    };
    assert.deepEqual(listed.auto, ["MT", "TTS", "ASR"]);
    assert.ok(listed.models.translation.length > 0);
    assert.equal(Object.values(listed.models).flat().some((id) => id.endsWith("-contributor")), false);
    assert.ok(toolModelChoices("OCR").every((id) => /^(openai|meta)\//.test(id)));
  });

  it("translates a long document in chunks of at most 5,000 characters and keeps paragraphs", async () => {
    const { executor, steps } = recordingExecutor();
    const paragraph = "Take one tablet daily. ".repeat(100).trim();
    const doc = Array.from({ length: 8 }, () => paragraph).join("\n\n");
    const result = (await runHypaTool(tool("translate_document"), executor, {
      text: doc,
      targetLang: "hausa",
      model: "default",
    })) as { translation: string; chunks: number; model?: string };
    assert.ok(doc.length > 15_000);
    assert.ok(result.chunks > 1 && result.chunks <= 10);
    assert.equal(steps.length, result.chunks);
    for (const step of steps) {
      assert.ok(String(step.input.text).length <= 5000);
      assert.equal(step.input.targetLang, "Hausa");
      assert.equal(step.input.model, "default");
    }
    assert.equal(result.translation.split("\n\n").length, 8);
    assert.equal(result.model, "gemini");
  });

  it("refuses a document over 20,000 characters before translating", async () => {
    const { executor, steps } = recordingExecutor();
    await assert.rejects(
      runHypaTool(tool("translate_document"), executor, { text: "a".repeat(20_001), targetLang: "Yoruba" }),
    );
    assert.equal(steps.length, 0);
  });

  it("checks a language pair against the catalog without a model call", async () => {
    const { executor, steps } = recordingExecutor();
    const check = (args: object) =>
      runHypaTool(tool("check_language_pair"), executor, args) as Promise<{
        supported: boolean;
        models: string[];
        unknown?: string[];
      }>;
    const yoruba = await check({ sourceLang: "English", targetLang: "yo" });
    assert.equal(yoruba.supported, true);
    assert.ok(yoruba.models.length > 0);
    assert.equal(yoruba.models.some((id) => id.endsWith("-contributor")), false);
    assert.equal(yoruba.models.includes("hypaai/auto"), false);
    assert.ok(yoruba.models.every((id) => toolModelChoices("MT").includes(id)));
    assert.ok((await check({ sourceLang: "Twi", targetLang: "English" })).models.some((id) => id.startsWith("mansa/")));
    assert.equal((await check({ sourceLang: "Twi", targetLang: "Yoruba" })).models.some((id) => id.startsWith("mansa/")), false);
    assert.deepEqual(await check({ targetLang: "Klingon" }), { supported: false, models: [], unknown: ["Klingon"] });
    assert.equal(steps.length, 0);
  });

  it("lists the voices and speech models for a language without a model call", async () => {
    const { executor, steps } = recordingExecutor();
    const voices = (args: object) =>
      runHypaTool(tool("list_voices"), executor, args) as Promise<{
        language?: string;
        code?: string;
        voices: string[];
        models: string[];
        unknown?: boolean;
      }>;
    const yoruba = await voices({ language: "yoruba" });
    assert.equal(yoruba.language, "Yoruba");
    assert.equal(yoruba.code, "yo");
    assert.ok(yoruba.voices.length > 0);
    assert.ok(yoruba.models.length > 0);
    assert.equal(yoruba.models.some((id) => id.endsWith("-contributor")), false);
    assert.deepEqual(await voices({ language: "Klingon" }), { voices: [], models: [], unknown: true });
    assert.equal(steps.length, 0);
  });

  it("gives today's word, or says there is none yet", async () => {
    const { executor, steps } = recordingExecutor();
    const word = () => runHypaTool(tool("word_of_the_day"), executor, {});
    assert.deepEqual(await word(), { available: true, ...todaysWord });
    todaysWord = null;
    assert.deepEqual(await word(), { available: false });
    assert.deepEqual(steps.map((entry) => entry.step), ["wordOfTheDay", "wordOfTheDay"]);
  });

  it("publishes MCP tools without chat-only inputs, requiring what the chat may skip", () => {
    for (const entry of HYPA_TOOLS) {
      const published = toMcpTool(entry);
      const keys = Object.keys(published.inputSchema.shape);
      assert.equal(
        keys.some((key) => key.startsWith("attached")),
        false,
        `${entry.name} keeps no attached input for MCP`,
      );
    }
    // The chat's attached-number shortcut means nothing to MCP, so audio is required again.
    assert.equal(toMcpTool(tool("speech_to_text")).inputSchema.safeParse({}).success, false);
    assert.equal(toMcpTool(tool("speech_to_text")).inputSchema.safeParse({ audio: "AAAA" }).success, true);
    assert.equal(toMcpTool(tool("process_voice_message")).inputSchema.safeParse({}).success, false);
    // Image tools already require their image for every client.
    assert.equal(toMcpTool(tool("extract_text_from_image")).inputSchema.safeParse({}).success, false);
    assert.deepEqual(
      Object.keys(toMcpTool(tool("translate_message")).inputSchema.shape).sort(),
      Object.keys(tool("translate_message").inputSchema.shape).sort(),
    );
  });

  it("keeps the chat hint in the function tools the agent's models read", () => {
    const speech = toFunctionTools().find((fn) => fn.function.name === "speech_to_text")!;
    assert.match(speech.function.description, /attachedAudio/);
    assert.match(speech.function.description, /^Transcribe a voice recording into text\. To hear audio/);
    const voice = toFunctionTools().find((fn) => fn.function.name === "process_voice_message")!;
    assert.match(voice.function.description, /attachedAudio/);
  });

  it("reports tool failures the same way for the agent and for MCP", () => {
    assert.deepEqual(toolFailureBody(new ToolFailure("Speech returned no audio", "speech", { translatedText: "hi" })), {
      error: "Speech returned no audio",
      stage: "speech",
      partialResult: { translatedText: "hi" },
    });
    assert.deepEqual(toolFailureBody(new ToolFailure("No audio was given.", "input")), {
      error: "No audio was given.",
      stage: "input",
    });
    assert.deepEqual(toolFailureBody(new Error("boom")), { error: "boom" });
    assert.deepEqual(toolFailureBody("nope"), { error: "Tool failed" });
  });

  it("tells an agent how to call speech from code, so it can write working code", () => {
    const { description } = tool("text_to_speech");
    assert.match(description, /https:\/\/api\.hypaintelligence\.com\/v2\/developer\/tts/);
    assert.match(description, /x-api-key/);
    assert.match(description, /provider, model, voice, text, language/);
    assert.match(description, /response\.audio_b64/);
  });
});
