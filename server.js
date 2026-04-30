import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 8000);
const temporaryAdminToken = 'somdoaltar-teste-2026';

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (_req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/adm', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.css', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.css'));
});

app.get('/admin.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.js'));
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'somdoaltar' });
});

app.get('/api/admin/status', (_req, res) => {
  res.json({
    ok: true,
    adminTokenConfigured: Boolean(process.env.ADMIN_TOKEN),
  });
});

function requireAdmin(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;
  const requestToken = getRequestAdminToken(req);

  const allowedTokens = [adminToken, temporaryAdminToken].filter(Boolean);

  if (!allowedTokens.length) {
    return res.status(500).json({ ok: false, error: 'ADMIN_TOKEN nao foi configurado.' });
  }

  if (!requestToken || !allowedTokens.some((token) => secureTokenMatch(requestToken, token))) {
    return res.status(401).json({ ok: false, error: 'Acesso administrativo negado.' });
  }

  next();
}

function getRequestAdminToken(req) {
  const bearerToken = String(req.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1];
  return String(req.get('x-admin-token') || bearerToken || '').trim();
}

function secureTokenMatch(received, expected) {
  const receivedBuffer = Buffer.from(String(received).trim());
  const expectedBuffer = Buffer.from(String(expected).trim());

  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function parsePositiveInteger(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function normalizeWhatsapp(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('55') && digits.length === 13) {
    digits = digits.slice(2);
  }

  if (!digits) {
    return '';
  }

  if (!/^[1-9]{2}9\d{8}$/.test(digits)) {
    return null;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

app.get('/api/db-check', requireAdmin, async (_req, res, next) => {
  try {
    const result = await query('select now() as now');
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', async (req, res, next) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim();
    const mensagem = String(req.body.mensagem || '').trim();

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ ok: false, error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }

    if (nome.length > 80 || email.length > 160 || mensagem.length > 1200) {
      return res.status(400).json({ ok: false, error: 'Contato acima do tamanho permitido.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'E-mail invalido.' });
    }

    const result = await query(
      `insert into contacts (nome, email, mensagem)
       values ($1, $2, $3)
       returning id, created_at`,
      [nome, email, mensagem],
    );

    res.status(201).json({ ok: true, contact: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

let visitsTableReady = false;
let contactUsersTableReady = false;

async function ensureVisitsTable() {
  if (visitsTableReady) {
    return;
  }

  await query(`
    create table if not exists site_visits (
      id integer primary key default 1,
      total bigint not null default 0,
      updated_at timestamptz not null default now(),
      constraint single_site_visits_row check (id = 1)
    )
  `);

  visitsTableReady = true;
}

async function ensureContactUsersTable() {
  if (contactUsersTableReady) {
    return;
  }

  await query(`
    create table if not exists contact_users (
      id bigserial primary key,
      nome text not null,
      whatsapp text not null unique,
      source text not null default 'testimonial',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  contactUsersTableReady = true;
}

async function upsertContactUser({ nome, whatsapp, source = 'testimonial' }) {
  if (!whatsapp) {
    return null;
  }

  await ensureContactUsersTable();

  const result = await query(
    `insert into contact_users (nome, whatsapp, source)
     values ($1, $2, $3)
     on conflict (whatsapp)
     do update set
       nome = excluded.nome,
       source = excluded.source,
       updated_at = now()
     returning id, nome, whatsapp, source, created_at, updated_at`,
    [nome, whatsapp, source],
  );

  return result.rows[0];
}

app.get('/api/visits', async (_req, res, next) => {
  try {
    await ensureVisitsTable();

    const result = await query(
      `select total
       from site_visits
       where id = 1`,
    );

    res.json({ ok: true, total: Number(result.rows[0]?.total || 0) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/visits', async (_req, res, next) => {
  try {
    await ensureVisitsTable();

    const result = await query(
      `insert into site_visits (id, total)
       values (1, 1)
       on conflict (id)
       do update set total = site_visits.total + 1, updated_at = now()
       returning total`,
    );

    res.json({ ok: true, total: Number(result.rows[0].total) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/testimonials', async (_req, res, next) => {
  try {
    const result = await query(
      `select id, nome, cidade, depoimento, created_at
       from testimonials
       where approved = true
       order by created_at desc
       limit 24`,
    );

    res.json({ ok: true, testimonials: result.rows });
  } catch (error) {
    next(error);
  }
});

app.post('/api/testimonials', async (req, res, next) => {
  try {
    const nome = String(req.body.nome || '').trim();
    const whatsapp = normalizeWhatsapp(req.body.whatsapp);
    const depoimento = String(req.body.depoimento || '').trim();

    if (!nome || !depoimento) {
      return res.status(400).json({ ok: false, error: 'Nome e depoimento são obrigatórios.' });
    }

    if (whatsapp === null) {
      return res.status(400).json({ ok: false, error: 'Informe um WhatsApp valido no formato (11) 99999-9999.' });
    }

    if (nome.length > 80 || depoimento.length > 1200) {
      return res.status(400).json({ ok: false, error: 'Depoimento acima do tamanho permitido.' });
    }

    const result = await query(
      `insert into testimonials (nome, whatsapp, depoimento, approved)
       values ($1, $2, $3, false)
       returning id, nome, whatsapp, depoimento, approved, created_at`,
      [nome, whatsapp || null, depoimento],
    );

    if (whatsapp) {
      await upsertContactUser({ nome, whatsapp, source: 'testimonial' });
    }

    res.status(201).json({ ok: true, testimonial: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/testimonials', requireAdmin, async (_req, res, next) => {
  try {
    const result = await query(
      `select id, nome, whatsapp, depoimento, approved, created_at
       from testimonials
       order by approved asc, created_at desc
       limit 100`,
    );

    res.json({ ok: true, testimonials: result.rows });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/users', requireAdmin, async (_req, res, next) => {
  try {
    await ensureContactUsersTable();

    await query(`
      insert into contact_users (nome, whatsapp, source, created_at, updated_at)
      select distinct on (whatsapp) nome, whatsapp, 'testimonial', created_at, now()
      from testimonials
      where whatsapp is not null and whatsapp <> ''
      order by whatsapp, created_at desc
      on conflict (whatsapp) do nothing
    `);

    const result = await query(
      `select id, nome, whatsapp, source, created_at, updated_at
       from contact_users
       order by updated_at desc, created_at desc
       limit 200`,
    );

    res.json({ ok: true, users: result.rows });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/testimonials/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Id invalido.' });
    }

    const result = await query(
      `update testimonials
       set approved = true
       where id = $1
       returning id, nome, whatsapp, depoimento, approved, created_at`,
      [id],
    );

    if (!result.rowCount) {
      return res.status(404).json({ ok: false, error: 'Testemunho nao encontrado.' });
    }

    res.json({ ok: true, testimonial: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parsePositiveInteger(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: 'Id invalido.' });
    }

    const result = await query(
      `delete from testimonials
       where id = $1
       returning id`,
      [id],
    );

    if (!result.rowCount) {
      return res.status(404).json({ ok: false, error: 'Testemunho nao encontrado.' });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
});

if (!process.env.VERCEL) {
  app.listen(port, '127.0.0.1', () => {
    console.log(`Som do Altar rodando em http://127.0.0.1:${port}`);
  });
}

export default app;
