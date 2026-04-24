import test from "node:test";
import assert from "node:assert/strict";
import { generateHookPost, generateSeoBlog } from "../src/content/generator.ts";

const fakeAdapter = {
  async generate(request: { prompt: string }) {
    return { text: `MODEL:${request.prompt.slice(0, 40)}`, model: "fake" };
  }
};

const voice = {
  id: "founder-voice",
  tone: "sharp",
  audience: "startup founders",
  style_guidelines: ["short sentences", "data-backed"]
};

test("generateSeoBlog returns structured result", async () => {
  const result = await generateSeoBlog(fakeAdapter, "AI agents", voice);
  assert.equal(result.kind, "content.blog");
  assert.equal(result.data.voice, "founder-voice");
  assert.match(String(result.data.draft), /MODEL:/);
});

test("generateHookPost supports x and linkedin", async () => {
  const x = await generateHookPost(fakeAdapter, "x", "AI", voice);
  const linkedin = await generateHookPost(fakeAdapter, "linkedin", "AI", voice);

  assert.equal(x.kind, "content.hook");
  assert.equal(linkedin.kind, "content.hook");
  assert.equal(x.data.platform, "x");
  assert.equal(linkedin.data.platform, "linkedin");
});
