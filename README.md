# Som do Altar

Site oficial da gravação do DVD **Som do Altar**, com experiência de entrada, contagem regressiva, repertório, mídia, equipe, local da gravação e depoimentos persistidos no Neon Postgres.

## Stack

- HTML, CSS e JavaScript puro no frontend
- Node.js com Express no backend
- PostgreSQL no Neon para depoimentos
- `pg` para conexão com o banco
- `dotenv` para variáveis de ambiente

## Requisitos

- Node.js instalado
- NPM instalado
- Banco PostgreSQL/Neon disponível

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Preencha o `DATABASE_URL` no `.env` com a string de conexão do Neon.

Exemplo de formato:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
PORT=8000
```

## Banco de dados

Prepare as tabelas necessárias:

```bash
npm run db:setup
```

Verifique a conexão:

```bash
npm run db:check
```

Tabelas criadas pelo setup:

- `contacts`: estrutura antiga de contato, mantida para compatibilidade.
- `testimonials`: depoimentos enviados pelos visitantes.

## Rodando localmente

```bash
npm run dev
```

Depois acesse:

```text
http://127.0.0.1:8000/
```

## Deploy na Vercel

O projeto está pronto para deploy na Vercel usando o `server.js` como função Node/Express e a pasta `public/` para arquivos estáticos.

Antes do deploy, configure as variáveis de ambiente no painel da Vercel:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
```

Não é necessário configurar `PORT` na Vercel.

Depois de importar o repositório:

- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: deixar vazio
- Output Directory: deixar vazio

Após o primeiro deploy, rode o setup do banco localmente ou pelo terminal com acesso ao mesmo `DATABASE_URL`:

```bash
npm run db:setup
```

## Rotas principais

- `GET /`: página principal
- `GET /api/health`: status básico do servidor
- `GET /api/db-check`: valida conexão com o banco
- `GET /api/testimonials`: lista depoimentos
- `POST /api/testimonials`: grava depoimento

Payload para envio de depoimento:

```json
{
  "nome": "Nome da pessoa",
  "depoimento": "Texto do depoimento"
}
```

## Estrutura

```text
.
├── public/
│   └── assets/
│       └── logo-original.png
├── scripts/
│   ├── check-db.js
│   └── setup-db.js
├── db.js
├── index.html
├── script.js
├── server.js
├── style.css
├── package.json
└── README.md
```

## Observações

- O arquivo `.env` não deve ser versionado.
- As imagens da seção Equipe são temporárias e podem ser substituídas pelos nomes, fotos e empresas reais.
- A seção Mídia está preparada para receber fotos posteriormente.
- Os depoimentos são exibidos em carrossel e gravados no Neon.
