# Som do Altar

Uma experiência digital para o projeto musical **Som do Altar**: página oficial de divulgação, jornada imersiva com áudio, contagem regressiva para a gravação, repertório, equipe, local do evento, captação de testemunhos e moderação administrativa.

O projeto foi pensado como uma vitrine de lançamento. Ele organiza a narrativa do DVD, apresenta os pontos de contato do público e cria uma base simples para relacionamento pós-evento por meio de testemunhos aprovados pela equipe.

## Visão de negócio

- **Posicionamento do projeto:** apresenta o Som do Altar como uma experiência musical e espiritual, com identidade visual própria e foco no lançamento do DVD.
- **Engajamento antes do evento:** entrada imersiva, música, contagem regressiva e bloqueio de informações estratégicas até a data definida.
- **Prova social:** visitantes podem enviar testemunhos, que só aparecem publicamente depois de aprovação administrativa.
- **Operação simples:** painel `/adm` para a equipe revisar, aprovar e remover depoimentos sem acessar diretamente o banco.
- **Mensuração básica:** contador de visitas persistido no banco para acompanhar tração do site.
- **Pronto para deploy:** estrutura compatível com Vercel e banco PostgreSQL gerenciado.

## Stack

- **Frontend:** HTML, CSS e JavaScript puro.
- **Backend:** Node.js 24 com Express.
- **Banco de dados:** PostgreSQL, recomendado via Neon.
- **Driver SQL:** `pg`.
- **Configuração local:** `dotenv`.
- **Deploy:** Vercel, usando `api/index.js` como entrada serverless.

## Funcionalidades

- Tela de entrada com áudio, progresso e opção de pular.
- Hero institucional do projeto Som do Altar.
- Contagem regressiva para a gravação.
- Repertório com áreas preparadas para letras oficiais.
- Links de redes sociais.
- Formulário público de testemunhos.
- Campo opcional de WhatsApp para relacionamento com participantes.
- Carrossel público com depoimentos aprovados.
- Painel administrativo protegido por token.
- Aprovação e remoção de testemunhos.
- Persistência de visitas.
- Health check da aplicação.
- Checagem de banco protegida por token administrativo.

## Segurança e dados sensíveis

Este repositório não deve versionar credenciais reais.

- `.env` está listado no `.gitignore`.
- `.env.example` contém apenas placeholders.
- `DATABASE_URL` e `ADMIN_TOKEN` devem ser configurados localmente e no painel da Vercel.
- As consultas SQL usam parâmetros (`$1`, `$2`) para reduzir risco de SQL injection.
- Rotas administrativas exigem o header `x-admin-token`.
- `/api/db-check` exige token administrativo para evitar exposição pública de status do banco.
- O backend limita o tamanho do JSON recebido.
- Inputs públicos têm validação de presença e tamanho.
- O script de setup cria/ajusta tabelas sem aprovar depoimentos pendentes automaticamente.

Importante: se uma credencial real já foi usada em ambiente local, rotacione a senha do banco e gere um novo `ADMIN_TOKEN` antes de publicar ou compartilhar o projeto.

## Variáveis de ambiente

Crie um arquivo `.env` local a partir do exemplo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

Formato esperado:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
ADMIN_TOKEN=um-token-longo-e-seguro
PORT=8000
```

Use um `ADMIN_TOKEN` longo, aleatório e exclusivo para cada ambiente.

## Instalação

```bash
npm install
```

## Banco de dados

Prepare as tabelas:

```bash
npm run db:setup
```

Tabelas usadas:

- `contacts`: estrutura de contato mantida para compatibilidade.
- `testimonials`: testemunhos enviados pelo público e moderados pela equipe.
- `site_visits`: contador persistente de visitas.

Para checar a conexão pelo script local:

```bash
npm run db:check
```

## Rodando localmente

```bash
npm run dev
```

Acesse:

```text
http://127.0.0.1:8000/
```

Painel administrativo:

```text
http://127.0.0.1:8000/adm
```

## API

Rotas públicas:

- `GET /`: site principal.
- `GET /api/health`: status básico da aplicação.
- `GET /api/testimonials`: lista testemunhos aprovados.
- `POST /api/testimonials`: envia testemunho para moderação.
- `GET /api/visits`: retorna total de visitas.
- `POST /api/visits`: incrementa e retorna total de visitas.

Rotas protegidas por `x-admin-token`:

- `GET /api/db-check`: valida conexão com o banco.
- `GET /api/admin/testimonials`: lista testemunhos para moderação.
- `PATCH /api/admin/testimonials/:id/approve`: aprova testemunho.
- `DELETE /api/admin/testimonials/:id`: remove testemunho.

Payload de testemunho:

```json
{
  "nome": "Nome da pessoa",
  "whatsapp": "11999999999",
  "depoimento": "Texto do testemunho"
}
```

## Deploy na Vercel

Configure as variáveis no painel da Vercel:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
ADMIN_TOKEN=um-token-longo-e-seguro
```

Configuração sugerida:

- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: vazio
- Output Directory: vazio

Depois do deploy, rode `npm run db:setup` em um ambiente com acesso ao mesmo `DATABASE_URL`.

## Estrutura

```text
.
|-- api/
|   `-- index.js
|-- public/
|   `-- assets/
|-- scripts/
|   |-- check-db.js
|   `-- setup-db.js
|-- admin.css
|-- admin.html
|-- admin.js
|-- db.js
|-- index.html
|-- script.js
|-- server.js
|-- style.css
|-- package.json
|-- vercel.json
`-- README.md
```

## Operação

1. Visitantes enviam testemunhos pelo site.
2. O backend grava cada testemunho como `approved = false`.
3. A equipe entra em `/adm` usando o token administrativo.
4. A equipe aprova ou remove os conteúdos recebidos.
5. Apenas testemunhos aprovados entram no carrossel público.

## Observações

- Não compartilhe `.env`, URL real do banco, senha do banco ou token administrativo.
- Troque imagens, letras e textos temporários por materiais oficiais antes do lançamento.
- O WhatsApp do testemunho e opcional, fica salvo para a equipe e nao aparece no carrossel publico.
- Para produção, considere adicionar rate limit persistente, autenticação administrativa com sessão e rotação periódica de credenciais.
