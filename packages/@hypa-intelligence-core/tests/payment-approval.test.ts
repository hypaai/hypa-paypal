import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { approvalLabels, formatApprovalAmount, lineTotal } from "../src/payment-approval";

// Locales separate groups with a no-break space; the test compares plain spaces.
const plain = (text: string) => text.replace(/[  ]/g, " ");

describe("approval amounts", () => {
  it("use the merchant's number format and keep the currency as a code, never words", () => {
    assert.equal(formatApprovalAmount("25", "USD", "en"), "25.00 USD");
    assert.equal(formatApprovalAmount("1234567.5", "USD", "en"), "1,234,567.50 USD");
    assert.equal(plain(formatApprovalAmount("1234567.5", "USD", "fr")), "1 234 567,50 USD");
    assert.equal(formatApprovalAmount("1234567.5", "EUR", "de"), "1.234.567,50 EUR");
    assert.equal(formatApprovalAmount("1234567.5", "USD", "hi"), "12,34,567.50 USD");
  });

  it("follow the currency's own decimals, and never drop digits the order has", () => {
    assert.equal(formatApprovalAmount("1234567", "JPY", "en"), "1,234,567 JPY");
    assert.equal(formatApprovalAmount("10", "KWD", "en"), "10.000 KWD");
    assert.equal(formatApprovalAmount("12.345678", "USD", "en"), "12.345678 USD");
  });

  it("do not round a large amount through a floating-point number", () => {
    assert.equal(formatApprovalAmount("9007199254740993.01", "USD", "en"), "9,007,199,254,740,993.01 USD");
  });

  it("show something readable for text that is not a plain decimal", () => {
    assert.equal(formatApprovalAmount("1e-7", "USD", "en"), "USD 1e-7");
    assert.equal(formatApprovalAmount("25.00", "usd", "en"), "usd 25.00");
  });

  it("fall back to English for a missing or unknown language", () => {
    assert.equal(formatApprovalAmount("10", "USD", null), "10.00 USD");
    assert.equal(formatApprovalAmount("10", "USD", "zz"), "10.00 USD");
  });
});

describe("line totals", () => {
  it("multiply as exact decimals", () => {
    assert.equal(lineTotal(3, "0.1"), "0.3");
    assert.equal(lineTotal(2, "12.50"), "25.00");
    assert.equal(lineTotal(0, "5"), "0");
    assert.equal(lineTotal(7, "19.99"), "139.93");
  });
});

describe("approval labels", () => {
  const english = approvalLabels("en");

  it("are in the merchant's language, using the base language of a regional code", () => {
    assert.equal(approvalLabels("fr").approve, "Approuver la commande");
    assert.equal(approvalLabels("fr-CA").approve, "Approuver la commande");
    assert.equal(approvalLabels("YO").approve, approvalLabels("yo").approve);
    assert.notEqual(approvalLabels("es").approve, english.approve);
  });

  it("fall back to English for a language there is no card for", () => {
    assert.deepEqual(approvalLabels("sw"), english);
    assert.deepEqual(approvalLabels(null), english);
    assert.deepEqual(approvalLabels(undefined), english);
  });

  it("have every label in every language, so a card never shows a blank", () => {
    for (const code of ["fr", "yo", "ig", "ha", "pcm", "es", "pt"]) {
      const labels = approvalLabels(code);
      assert.deepEqual(Object.keys(labels), Object.keys(english), code);
      for (const [key, value] of Object.entries(labels)) {
        assert.ok(value.trim(), `${code}.${key} is empty`);
      }
    }
  });
});
