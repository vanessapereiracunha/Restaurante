require('dotenv').config();

function staffAuth(req, res, next) {
  const token = req.headers['x-staff-token'] || req.query.token;
  if (!token || token !== process.env.STAFF_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Acesso negado. Token de staff invalido ou ausente.' });
  }
  next();
}

module.exports = staffAuth;
