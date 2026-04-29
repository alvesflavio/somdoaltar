import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 8000);

app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (_req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'somdoaltar' });
});

app.get('/api/db-check', async (_req, res, next) => {
  try {
    const result = await query('select now() as now');
    res.json({ ok: true, now: result.rows[0].now });
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', async (req, res, next) => {
  try {
    const { nome, email, mensagem } = req.body;

    if (!nome || !email || !mensagem) {
      return res.status(400).json({ ok: false, error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }

    const result = await query(
      `insert into contacts (nome, email, mensagem)
       values ($1, $2, $3)
       returning id, created_at`,
      [nome.trim(), email.trim(), mensagem.trim()],
    );

    res.status(201).json({ ok: true, contact: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get('/api/testimonials', async (_req, res, next) => {
  try {
    const result = await query(
      `select id, nome, cidade, depoimento, created_at
       from testimonials
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
    const depoimento = String(req.body.depoimento || '').trim();

    if (!nome || !depoimento) {
      return res.status(400).json({ ok: false, error: 'Nome e depoimento são obrigatórios.' });
    }

    if (nome.length > 80 || depoimento.length > 1200) {
      return res.status(400).json({ ok: false, error: 'Depoimento acima do tamanho permitido.' });
    }

    const result = await query(
      `insert into testimonials (nome, depoimento)
       values ($1, $2)
       returning id, nome, depoimento, created_at`,
      [nome, depoimento],
    );

    res.status(201).json({ ok: true, testimonial: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: 'Erro interno do servidor.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Som do Altar rodando em http://127.0.0.1:${port}`);
});
