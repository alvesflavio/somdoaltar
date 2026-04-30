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
    whatsapp text,
    depoimento text not null,
    approved boolean not null default false,
    created_at timestamptz not null default now()
  )
`);

await query(`
  alter table testimonials
  add column if not exists approved boolean not null default false
`);

await query(`
  alter table testimonials
  add column if not exists whatsapp text
`);

await query(`
  create table if not exists site_visits (
    id integer primary key default 1,
    total bigint not null default 0,
    updated_at timestamptz not null default now(),
    constraint single_site_visits_row check (id = 1)
  )
`);

await pool.end();
console.log('Banco preparado: tabelas contacts, testimonials e site_visits disponiveis.');
