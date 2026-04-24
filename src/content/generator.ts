import type { InferenceAdapter } from "../core/contracts.ts";
import type { VoiceProfile } from "./voiceProfiles.ts";

export async function generateSeoBlog(adapter: InferenceAdapter, topic: string, voice: VoiceProfile) {
  const prompt = [
    "Write a SEO-friendly blog draft with:",
    "- title",
    "- target keywords",
    "- outline",
    "- intro",
    "- key insights",
    "Topic:",
    topic,
    "Voice:",
    JSON.stringify(voice)
  ].join("\n");

  const response = await adapter.generate({ prompt, temperature: 0.3 });
  return {
    kind: "content.blog",
    summary: `Generated SEO blog draft for ${topic}`,
    data: {
      topic,
      voice: voice.id,
      draft: response.text
    }
  };
}

export async function generateHookPost(
  adapter: InferenceAdapter,
  platform: "linkedin" | "x",
  topic: string,
  voice: VoiceProfile
) {
  const characterHint = platform === "x" ? "under 280 chars" : "under 600 chars";
  const prompt = [
    `Write a high-conversion ${platform} hook post ${characterHint}.`,
    "Include a curiosity gap and clear CTA.",
    `Topic: ${topic}`,
    `Voice: ${JSON.stringify(voice)}`
  ].join("\n");

  const response = await adapter.generate({ prompt, temperature: 0.5 });
  return {
    kind: "content.hook",
    summary: `Generated ${platform} hook for ${topic}`,
    data: {
      platform,
      topic,
      voice: voice.id,
      post: response.text
    }
  };
}
