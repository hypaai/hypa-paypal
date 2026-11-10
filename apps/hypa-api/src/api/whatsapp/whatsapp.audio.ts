import { spawn } from 'node:child_process';

const TIMEOUT_MS = 30_000;
const MAX_BYTES = 16 * 1024 * 1024;

const FORMATS = {
  // WhatsApp shows only OGG with Opus as a voice note.
  voice: ['-c:a', 'libopus', '-b:a', '32k', '-ac', '1', '-ar', '48000', '-f', 'ogg'],
  // Mono 16 kHz is what speech recognition expects, whatever the phone recorded.
  speech: ['-c:a', 'libmp3lame', '-b:a', '48k', '-ac', '1', '-ar', '16000', '-f', 'mp3'],
} as const;

/** Re-encodes audio with ffmpeg: `voice` for a reply the customer will hear, `speech` for a recording to transcribe. */
export function convertAudio(input: Buffer, to: keyof typeof FORMATS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn', ...FORMATS[to], 'pipe:1']);
    const chunks: Buffer[] = [];
    let size = 0;
    let errors = '';
    const timer = setTimeout(() => ffmpeg.kill('SIGKILL'), TIMEOUT_MS);
    ffmpeg.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BYTES) ffmpeg.kill('SIGKILL');
      else chunks.push(chunk);
    });
    ffmpeg.stderr.on('data', (chunk: Buffer) => (errors = (errors + chunk).slice(-500)));
    ffmpeg.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    ffmpeg.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && size > 0 && size <= MAX_BYTES) resolve(Buffer.concat(chunks));
      else reject(new Error(`Audio could not be converted (ffmpeg ${code ?? 'killed'}): ${errors.trim()}`));
    });
    ffmpeg.stdin.on('error', () => undefined);
    ffmpeg.stdin.end(input);
  });
}
