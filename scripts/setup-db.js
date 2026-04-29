import 'dotenv/config';
import { pool, query } from '../db.js';

await query(`
  create table if not exists contacts (
    id bigserial primary key,
    nome text not null,
    email text not null,
    mensagem text not null,
    created_at timestamptz not null default now()
  )
`);

await query(`
  create table if not exists testimonials (
    id bigserial primary key,
    nome text not null,
    cidade text,
    depoimento text not null,
    created_at timestamptz not null default now()
  )
`);

await pool.end();
console.log('Banco preparado: tabelas contacts e testimonials disponíveis.');
