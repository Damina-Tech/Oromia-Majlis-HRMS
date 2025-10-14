import { Router } from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  res.json({
    token,
    user: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.role === 'Admin' ? ['all'] : ['read']
    }
  });
});

router.post('/seed-admin', (req, res) => {
  const { email = 'admin@company.com', password = 'admin123', name = 'Admin', role = 'Admin' } = req.body || {};
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) return res.json({ ok: true, alreadyExists: true });
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)')
    .run(email, passwordHash, name, role);
  res.json({ ok: true });
});

export default router;


