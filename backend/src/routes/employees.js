import { Router } from 'express';
import db from '../db.js';

export const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
  res.json(rows.map((r) => ({ ...r, id: String(r.id) })));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, id: String(row.id) });
});

router.post('/', (req, res) => {
  const e = req.body || {};
  const stmt = db.prepare(`INSERT INTO employees
    (name, email, phone, department, designation, joiningDate, status, manager, salary, avatar, address, emergencyContact, employeeId)
    VALUES (@name, @email, @phone, @department, @designation, @joiningDate, @status, @manager, @salary, @avatar, @address, @emergencyContact, @employeeId)`);
  const info = stmt.run(e);
  const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...created, id: String(created.id) });
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const merged = { ...existing, ...req.body };
  db.prepare(`UPDATE employees SET
    name=@name, email=@email, phone=@phone, department=@department, designation=@designation,
    joiningDate=@joiningDate, status=@status, manager=@manager, salary=@salary, avatar=@avatar,
    address=@address, emergencyContact=@emergencyContact, employeeId=@employeeId
    WHERE id = @id`).run({ ...merged, id });
  const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
  res.json({ ...updated, id: String(updated.id) });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const info = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

export default router;


