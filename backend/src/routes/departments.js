import { Router } from 'express';
import db from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  res.json(rows.map((r) => ({ ...r, id: String(r.id) })));
});

router.post('/', (req, res) => {
  const { name, head, description } = req.body || {};
  const info = db.prepare('INSERT INTO departments (name, head, description) VALUES (?, ?, ?)')
    .run(name, head, description);
  const created = db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...created, id: String(created.id) });
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name = existing.name, head = existing.head, description = existing.description } = req.body || {};
  db.prepare('UPDATE departments SET name = ?, head = ?, description = ? WHERE id = ?')
    .run(name, head, description, id);
  const updated = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  res.json({ ...updated, id: String(updated.id) });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const info = db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;


