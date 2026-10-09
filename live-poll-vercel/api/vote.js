const { OPTIONS, redis, voterId } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  try {
    const id = voterId(req, res);
    const i = req.body && req.body.i;
    if (!Number.isInteger(i) || i < 0 || i >= OPTIONS.length) return res.status(400).json({ ok: false, error: 'Invalid option.' });
    const [open] = await redis(['GET', 'poll:open']);
    if (open === '0') return res.status(200).json({ ok: false, error: 'Voting is closed.' });
    await redis(['HSET', 'poll:votes', id, String(i)]);   // one vote per browser; voting again changes it
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
};
