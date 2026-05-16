const xmlrpc = require('xmlrpc');
const path = require('path');
const pool = require(path.join(__dirname, 'config/db'));

const ODOO_CONFIG = {
  host: '127.0.0.1',
  port: parseInt(process.env.ODOO_PORT) || 8069,
  db: process.env.ODOO_DB || 'odoo_mitech',
  username: process.env.ODOO_USER || 'admin',
  password: process.env.ODOO_PASSWORD || 'admin'
};

// ─── AUTHENTICATE ────────────────────────────────────────────
function authenticate() {
  return new Promise((resolve, reject) => {
    const client = xmlrpc.createClient({
      host: ODOO_CONFIG.host, port: ODOO_CONFIG.port, path: '/xmlrpc/2/common'
    });
    client.methodCall('authenticate', [
      ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}
    ], (err, uid) => {
      if (err || !uid) reject(err || new Error('Authentication failed'));
      else resolve(uid);
    });
  });
}

// ─── SEARCH & READ ───────────────────────────────────────────
function searchRead(uid, model, domain, fields) {
  return new Promise((resolve, reject) => {
    const client = xmlrpc.createClient({
      host: ODOO_CONFIG.host, port: ODOO_CONFIG.port, path: '/xmlrpc/2/object'
    });
    client.methodCall('execute_kw', [
      ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
      model, 'search_read', [domain], { fields }
    ], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ─── MAP last_update_status ──────────────────────────────────
function mapStatus(val) {
  const allowed = ['on_track', 'at_risk', 'off_track', 'done'];
  if (allowed.includes(val)) return val;
  return 'on_track';
}

// ─── SYNC PROJECT_PROJECT ────────────────────────────────────
async function syncProjects(uid) {
  const records = await searchRead(uid, 'project.project', [],
    ['id', 'name', 'description', 'date_start', 'date', 'user_id', 'partner_id', 'active', 'last_update_status']);

  let count = 0;
  for (const r of records) {
    try {
      await pool.query(`
        INSERT INTO project_project 
          (name, description, date_start, date, user_id, partner_id, active, last_update_status, odoo_id, last_sync_at)
        VALUES ($1,$2,$3,$4,
          (SELECT id FROM users WHERE nom ILIKE $5 LIMIT 1),
          (SELECT id FROM users WHERE odoo_id = $6 LIMIT 1),
          $7,$8,$9,NOW())
        ON CONFLICT (odoo_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          date_start = EXCLUDED.date_start,
          date = EXCLUDED.date,
          active = EXCLUDED.active,
          last_update_status = EXCLUDED.last_update_status,
          partner_id = EXCLUDED.partner_id,
          last_sync_at = NOW(),
          updated_at = NOW()
      `, [
        r.name,
        r.description || null,
        r.date_start || null,
        r.date || null,
        r.user_id ? r.user_id[1] : 'admin',
        r.partner_id ? r.partner_id[0] : null,
        r.active ?? true,
        mapStatus(r.last_update_status),
        r.id
      ]);
      count++;
    } catch (e) {
      console.error(`Project sync error (id=${r.id}):`, e.message);
    }
  }
  return count;
}

// ─── SYNC PROJECT_TASK (Odoo 18 compatible) ──────────────────
async function syncTasks(uid) {
  const records = await searchRead(uid, 'project.task', [],
    ['id', 'name', 'description', 'project_id', 'date_deadline', 'stage_id', 'priority']);

  let count = 0;
  for (const r of records) {
    try {
      await pool.query(`
        INSERT INTO project_task
          (name, description, project_id, date_deadline, stage_id, priority, odoo_id, last_sync_at)
        VALUES ($1,$2,
          (SELECT id FROM project_project WHERE odoo_id = $3 LIMIT 1),
          $4,$5,$6,$7,NOW())
        ON CONFLICT (odoo_id) DO UPDATE SET
          name = EXCLUDED.name,
          stage_id = EXCLUDED.stage_id,
          priority = EXCLUDED.priority,
          date_deadline = EXCLUDED.date_deadline,
          last_sync_at = NOW(),
          updated_at = NOW()
      `, [
        r.name,
        r.description || null,
        r.project_id ? r.project_id[0] : null,
        r.date_deadline || null,
        r.stage_id ? r.stage_id[1] : null,
        r.priority || '0',
        r.id
      ]);
      count++;
    } catch (e) {
      console.error(`Task sync error (id=${r.id}):`, e.message);
    }
  }
  return count;
}

// ─── SYNC PURCHASE_ORDER ─────────────────────────────────────
async function syncPurchaseOrders(uid) {
  const records = await searchRead(uid, 'purchase.order', [],
    ['id', 'name', 'partner_id', 'user_id', 'date_order', 'date_approve', 'state', 'amount_total', 'currency_id', 'notes']);

  let count = 0;
  for (const r of records) {
    try {
      await pool.query(`
        INSERT INTO purchase_order
          (name, partner_id, user_id, date_order, date_approve, state, amount_total, currency_id, notes, odoo_id, last_sync_at)
        VALUES ($1,
          (SELECT id FROM users WHERE odoo_id = $2 LIMIT 1),
          (SELECT id FROM users WHERE nom ILIKE $3 LIMIT 1),
          $4,$5,$6,$7,$8,$9,$10,NOW())
        ON CONFLICT (odoo_id) DO UPDATE SET
          name = EXCLUDED.name,
          state = EXCLUDED.state,
          amount_total = EXCLUDED.amount_total,
          partner_id = EXCLUDED.partner_id,
          last_sync_at = NOW(),
          updated_at = NOW()
      `, [
        r.name,
        r.partner_id ? r.partner_id[0] : null,
        r.user_id ? r.user_id[1] : 'admin',
        r.date_order || null,
        r.date_approve || null,
        r.state || 'draft',
        r.amount_total || 0,
        r.currency_id ? r.currency_id[1] : 'TND',
        r.notes || null,
        r.id
      ]);
      count++;
    } catch (e) {
      console.error(`PO sync error (id=${r.id}):`, e.message);
    }
  }
  return count;
}

// ─── SYNC ACCOUNT_MOVE ───────────────────────────────────────
async function syncInvoices(uid) {
  const records = await searchRead(uid, 'account.move',
    [['move_type', 'in', ['out_invoice', 'in_invoice']]],
    ['id', 'name', 'partner_id', 'invoice_date', 'invoice_date_due', 'amount_total', 'amount_residual', 'payment_state', 'state']);

  let count = 0;
  for (const r of records) {
    try {
      await pool.query(`
        INSERT INTO account_move
          (name, partner_id, invoice_date, invoice_date_due, amount_total, amount_residual, payment_state, state, odoo_id, last_sync_at)
        VALUES ($1,
          (SELECT id FROM users WHERE odoo_id = $2 LIMIT 1),
          $3,$4,$5,$6,$7,$8,$9,NOW())
        ON CONFLICT (odoo_id) DO UPDATE SET
          name = EXCLUDED.name,
          state = EXCLUDED.state,
          payment_state = EXCLUDED.payment_state,
          amount_total = EXCLUDED.amount_total,
          amount_residual = EXCLUDED.amount_residual,
          partner_id = EXCLUDED.partner_id,
          last_sync_at = NOW(),
          updated_at = NOW()
      `, [
        r.name,
        r.partner_id ? r.partner_id[0] : null,
        r.invoice_date || null,
        r.invoice_date_due || null,
        r.amount_total || 0,
        r.amount_residual || 0,
        r.payment_state || 'not_paid',
        r.state || 'draft',
        r.id
      ]);
      count++;
    } catch (e) {
      console.error(`Invoice sync error (id=${r.id}):`, e.message);
    }
  }
  return count;
}

// ─── SYNC CONTACTS (res.partner → users) ─────────────────────
// Moch automatique — juste via "Depuis Odoo" fil modal
async function syncContacts(uid) {
  const records = await searchRead(uid, 'res.partner',
    [['is_company', '=', false], ['email', '!=', false]],
    ['id', 'name', 'email', 'phone', 'mobile', 'company_id', 'function', 'comment']);

  let count = 0;
  for (const r of records) {
    if (!r.email) continue;
    const parts = (r.name || '').trim().split(' ');
    const prenom = parts[0] || r.name;
    const nom = parts.slice(1).join(' ') || prenom;
    const fn = typeof r.function === 'string' ? r.function.toLowerCase() : '';
    let roleId = 2;
    if (fn.includes('fournisseur') || fn.includes('supplier')) roleId = 3;
    else if (fn.includes('partenaire') || fn.includes('partner')) roleId = 4;

    try {
      // Update only — moch create
      await pool.query(`
        UPDATE users SET
          nom = $1, prenom = $2, telephone = $3, last_sync_at = NOW()
        WHERE odoo_id = $4
      `, [nom, prenom, r.phone || r.mobile || null, r.id]);
      count++;
    } catch (e) {
      console.error(`Contact sync error (id=${r.id}):`, e.message);
    }
  }
  return count;
}

// ─── SYNC ALL — contacts moch automatique ────────────────────
async function syncAll() {
  const uid = await authenticate();
  const results = { projects: 0, tasks: 0, purchase_orders: 0, invoices: 0 };

  try {
    results.projects = await syncProjects(uid);
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status) VALUES ($1,$2,'success')`,
      ['project.project', results.projects]);
  } catch (e) {
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status, error_message) VALUES ($1,0,'error',$2)`,
      ['project.project', e.message]);
  }

  try {
    results.tasks = await syncTasks(uid);
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status) VALUES ($1,$2,'success')`,
      ['project.task', results.tasks]);
  } catch (e) {
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status, error_message) VALUES ($1,0,'error',$2)`,
      ['project.task', e.message]);
  }

  try {
    results.purchase_orders = await syncPurchaseOrders(uid);
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status) VALUES ($1,$2,'success')`,
      ['purchase.order', results.purchase_orders]);
  } catch (e) {
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status, error_message) VALUES ($1,0,'error',$2)`,
      ['purchase.order', e.message]);
  }

  try {
    results.invoices = await syncInvoices(uid);
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status) VALUES ($1,$2,'success')`,
      ['account.move', results.invoices]);
  } catch (e) {
    await pool.query(`INSERT INTO odoo_sync_logs (model, records_synced, status, error_message) VALUES ($1,0,'error',$2)`,
      ['account.move', e.message]);
  }

  return results;
}

// ─── TEST CONNECTION ─────────────────────────────────────────
async function testConnection() {
  const uid = await authenticate();
  return { connected: true, uid, db: ODOO_CONFIG.db };
}

module.exports = {
  syncAll,
  testConnection,
  authenticate,
  searchRead,
  syncContacts,
  syncProjects,
  syncTasks,
  syncPurchaseOrders,
  syncInvoices
};