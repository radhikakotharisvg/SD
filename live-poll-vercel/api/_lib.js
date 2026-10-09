// Shared helpers (files starting with "_" are not exposed as API routes)
const crypto = require('crypto');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const OPTIONS = ['Waiting with no update','Repeating my problem to a new person','Confusing forms','Nobody knows who is responsible','Hidden charges','Being passed between departments','Long queues with no estimate','Rude or rushed staff','Cancelling is harder than signing up','A refund that never arrives','Different answers from different people','Chatbots that cannot reach a human','Promised delivery times that slip','Having to create an account just to buy','Repeating my ID at every desk'];

// Run one or more Redis commands in a single request, e.g. redis(['GET','k'], ['HVALS','h'])
async function redis(...cmds) {
  if (!URL_ || !TOKEN) throw new Error('Redis is not configured. Add Upstash Redis in the Vercel Storage tab and redeploy.');
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j));
  return j.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// One anonymous id per browser, kept in a cookie
function voterId(req, res) {
  let id = (/(?:^|; )vid=([\w-]+)/.exec(req.headers.cookie || '') || [])[1];
  if (!id) {
    id = crypto.randomUUID();
    res.setHeader('Set-Cookie', `vid=${id}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  }
  return id;
}

async function snapshot() {
  const [vals, open] = await redis(['HVALS', 'poll:votes'], ['GET', 'poll:open']);
  const counts = OPTIONS.map(() => 0);
  vals.forEach(v => { const i = Number(v); if (counts[i] !== undefined) counts[i]++; });
  return { options: OPTIONS, counts, total: vals.length, open: open !== '0' };
}

const isAdmin = req => !!process.env.ADMIN_KEY && (req.query.key || '') === process.env.ADMIN_KEY;
module.exports = { OPTIONS, redis, voterId, snapshot, isAdmin };
