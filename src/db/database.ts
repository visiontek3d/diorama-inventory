import * as SQLite from 'expo-sqlite';
import { Component, Diorama, Transaction } from '../types';

const db = SQLite.openDatabaseSync('diorama.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dioramas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    photo_uri TEXT,
    walls_qty INTEGER DEFAULT 0,
    open_door_qty INTEGER DEFAULT 0,
    lift_qty INTEGER DEFAULT 0,
    one_off_qty INTEGER DEFAULT 0,
    carry_stock INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    component TEXT NOT NULL,
    qty INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate existing databases that don't have newer columns yet
try {
  db.execSync('ALTER TABLE dioramas ADD COLUMN one_off_qty INTEGER DEFAULT 0');
} catch (_) {}
try {
  db.execSync('ALTER TABLE dioramas ADD COLUMN carry_stock INTEGER DEFAULT 0');
} catch (_) {}

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export function getAllDioramas(): Diorama[] {
  return db.getAllSync<Diorama>('SELECT * FROM dioramas ORDER BY sku ASC');
}

export function getDiorama(sku: string): Diorama | null {
  return db.getFirstSync<Diorama>('SELECT * FROM dioramas WHERE sku = ?', [sku]) ?? null;
}

export function createDiorama(sku: string, description: string, photo_uri: string | null, carry_stock: boolean): void {
  db.runSync(
    'INSERT INTO dioramas (sku, description, photo_uri, carry_stock) VALUES (?, ?, ?, ?)',
    [sku, description, photo_uri ?? null, carry_stock ? 1 : 0]
  );
}

export function updateDiorama(sku: string, description: string, photo_uri: string | null, carry_stock: boolean): void {
  db.runSync(
    'UPDATE dioramas SET description = ?, photo_uri = ?, carry_stock = ? WHERE sku = ?',
    [description, photo_uri ?? null, carry_stock ? 1 : 0, sku]
  );
}

export function deleteDiorama(sku: string): void {
  db.runSync('DELETE FROM dioramas WHERE sku = ?', [sku]);
  db.runSync('DELETE FROM transactions WHERE sku = ?', [sku]);
}

export function adjustInventory(sku: string, component: Component, qty: number): void {
  const column = `${component}_qty`;
  db.runSync(
    `UPDATE dioramas SET ${column} = MAX(0, ${column} + ?) WHERE sku = ?`,
    [qty, sku]
  );
  db.runSync(
    'INSERT INTO transactions (sku, component, qty) VALUES (?, ?, ?)',
    [sku, component, qty]
  );
}

export function getTransactions(sku: string): Transaction[] {
  return db.getAllSync<Transaction>(
    'SELECT * FROM transactions WHERE sku = ? ORDER BY created_at DESC LIMIT 50',
    [sku]
  );
}

export function searchDioramas(query: string): Diorama[] {
  const like = `%${query}%`;
  return db.getAllSync<Diorama>(
    'SELECT * FROM dioramas WHERE sku LIKE ? OR description LIKE ? ORDER BY sku ASC',
    [like, like]
  );
}

export type BulkImportResult = { inserted: number; skipped: number; errors: string[] };

export function bulkImportDioramas(
  rows: { sku: string; description: string; walls: number; open_door: number; lift: number }[]
): BulkImportResult {
  const result: BulkImportResult = { inserted: 0, skipped: 0, errors: [] };
  for (const row of rows) {
    try {
      const existing = db.getFirstSync('SELECT sku FROM dioramas WHERE sku = ?', [row.sku]);
      if (existing) {
        result.skipped++;
        continue;
      }
      db.runSync(
        'INSERT INTO dioramas (sku, description, walls_qty, open_door_qty, lift_qty) VALUES (?, ?, ?, ?, ?)',
        [row.sku, row.description, row.walls, row.open_door, row.lift]
      );
      result.inserted++;
    } catch (e: any) {
      result.errors.push(`${row.sku}: ${e.message}`);
    }
  }
  return result;
}
