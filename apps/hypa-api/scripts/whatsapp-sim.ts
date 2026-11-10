/**
 * Plays WhatsApp for local demos of Hypa Bridge, with no Meta account.
 *
 *   1. Start the API with WHATSAPP_GRAPH_URL=http://localhost:4010 and WHATSAPP_APP_SECRET set.
 *   2. Connect a number in the app (or POST /v2/whatsapp/number) with the phone number id below and any token.
 *   3. pnpm --filter hypa-api whatsapp:sim, then type as the customer.
 *
 * It signs webhooks like Meta does, and answers the Graph calls the bridge makes, printing every reply.
 * Lines: plain text, "/voice <file>", "/image <file> [caption]", "/quit".
 */
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';

const api = process.env.SIM_API_URL ?? 'http://localhost:5678';
const port = Number(process.env.SIM_GRAPH_PORT ?? 4010);
const secret = process.env.WHATSAPP_APP_SECRET;
const numberId = process.env.SIM_PHONE_NUMBER_ID ?? '1415999774934646';
const customer = process.env.SIM_CUSTOMER ?? '2348000000001';
const name = process.env.SIM_CUSTOMER_NAME ?? 'Ada';
if (!secret) throw new Error('Set WHATSAPP_APP_SECRET to the same value the API uses.');

const media = new Map<string, { bytes: Buffer; mime: string }>();
const mimeOf = (file: string) =>
  file.endsWith('.ogg') || file.endsWith('.opus') ? 'audio/ogg' : file.endsWith('.png') ? 'image/png' : file.match(/\.jpe?g$/) ? 'image/jpeg' : 'audio/mpeg';

/** The few Graph routes the bridge calls. */
createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);
  const json = (value: unknown) => res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(value));
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && parts[0] === 'files') {
    const file = media.get(parts[1]);
    return file ? res.writeHead(200, { 'Content-Type': file.mime }).end(file.bytes) : res.writeHead(404).end();
  }
  if (req.method === 'GET') {
    const file = media.get(parts[1]);
    return json(file ? { url: `http://localhost:${port}/files/${parts[1]}`, mime_type: file.mime, file_size: file.bytes.length } : { id: parts[1], display_phone_number: '15551774952' });
  }
  if (parts[2] === 'media') {
    const id = randomUUID();
    media.set(id, { bytes: body, mime: 'audio/ogg' });
    return json({ id });
  }
  if (parts[2] === 'messages') {
    const sent = JSON.parse(body.toString()) as { type: string; text?: { body: string }; template?: { name: string } };
    console.log(`\n  ← [${sent.type}] ${sent.text?.body ?? sent.template?.name ?? ''}\n`);
    return json({ messages: [{ id: `wamid.sim.${randomUUID()}` }] });
  }
  res.writeHead(404).end();
}).listen(port, () => console.log(`Fake Graph on http://localhost:${port}. Customer ${customer} -> number ${numberId}.`));

async function post(message: Record<string, unknown>) {
  const body = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ id: 'sim', changes: [{ field: 'messages', value: {
      messaging_product: 'whatsapp',
      metadata: { phone_number_id: numberId },
      contacts: [{ profile: { name }, wa_id: customer }],
      messages: [{ from: customer, id: `wamid.sim.${randomUUID()}`, timestamp: String(Math.floor(Date.now() / 1000)), ...message }],
    } }] }],
  });
  const signature = `sha256=${createHmac('sha256', secret!).update(body).digest('hex')}`;
  const response = await fetch(`${api}/v2/whatsapp/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body });
  if (!response.ok) console.log(`  webhook answered ${response.status}`);
}

function upload(file: string) {
  const id = randomUUID();
  media.set(id, { bytes: readFileSync(file), mime: mimeOf(file) });
  return { id, mime_type: mimeOf(file) };
}

const lines = createInterface({ input: process.stdin });
lines.on('line', async (line) => {
  const [command, file, ...rest] = line.trim().split(' ');
  try {
    if (command === '/quit') process.exit(0);
    else if (command === '/voice') await post({ type: 'audio', audio: upload(file) });
    else if (command === '/image') await post({ type: 'image', image: { ...upload(file), caption: rest.join(' ') || undefined } });
    else if (line.trim()) await post({ type: 'text', text: { body: line.trim() } });
  } catch (error) {
    console.log(`  ${(error as Error).message}`);
  }
});
