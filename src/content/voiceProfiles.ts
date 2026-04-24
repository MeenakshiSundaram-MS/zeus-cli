import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const VOICE_PATH = join(homedir(), ".zeus", "voices.json");

export interface VoiceProfile {
  id: string;
  tone: string;
  audience: string;
  style_guidelines: string[];
}

async function ensureVoiceFile(): Promise<void> {
  await mkdir(dirname(VOICE_PATH), { recursive: true });
  try {
    await readFile(VOICE_PATH, "utf8");
  } catch {
    await writeFile(VOICE_PATH, "[]\n", "utf8");
  }
}

export async function listVoices(): Promise<VoiceProfile[]> {
  await ensureVoiceFile();
  const raw = await readFile(VOICE_PATH, "utf8");
  return JSON.parse(raw) as VoiceProfile[];
}

export async function saveVoice(profile: VoiceProfile): Promise<void> {
  const voices = await listVoices();
  const deduped = voices.filter((voice) => voice.id !== profile.id);
  deduped.push(profile);
  await writeFile(VOICE_PATH, `${JSON.stringify(deduped, null, 2)}\n`, "utf8");
}

export async function getVoice(id: string): Promise<VoiceProfile | undefined> {
  const voices = await listVoices();
  return voices.find((voice) => voice.id === id);
}
