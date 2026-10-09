const { redis, snapshot, isAdmin } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.ADMIN_KEY) return res.status(500).json({ error: 'Set the ADMIN_KEY environment variable in Vercel and redeploy.' });
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    if (req.method === 'POST') {
      const action = req.body && req.body.action;
      if (action === 'toggle') { const [o] = await redis(['GET', 'poll:open']); await redis(['SET', 'poll:open', o === '0' ? '1' : '0']); }
      else if (action === 'reset') await redis(['DEL', 'poll:votes']);
    }
    res.status(200).json(await snapshot());
  } catch (e) { res.status(500).json({ error: e.message }); }
};
