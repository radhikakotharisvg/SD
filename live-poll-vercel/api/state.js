const { OPTIONS, redis, voterId } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const id = voterId(req, res);
    const [mine, open] = await redis(['HGET', 'poll:votes', id], ['GET', 'poll:open']);
    res.status(200).json({ options: OPTIONS, mine: mine === null ? null : Number(mine), open: open !== '0' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
