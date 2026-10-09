const { OPTIONS, redis, voterId } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  try {
    const id = voterId(req, res);
    const raw = req.body && req.body.choices;
    if (!Array.isArray(raw) || raw.length > OPTIONS.length) return res.status(400).json({ ok: false, error: 'Invalid choices.' });
    const choices = [...new Set(raw)].sort((a, b) => a - b);
    if (!choices.every(i => Number.isInteger(i) && i >= 0 && i < OPTIONS.length)) return res.status(400).json({ ok: false, error: 'Invalid option.' });
    const [open] = await redis(['GET', 'poll:open']);
    if (open === '0') return res.status(200).json({ ok: false, error: 'Voting is closed.' });
    // Each browser saves its full set of picks; saving again replaces it. No picks removes the vote.
    if (choices.length) await redis(['HSET', 'poll:votes', id, JSON.stringify(choices)]);
    else await redis(['HDEL', 'poll:votes', id]);
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
};
