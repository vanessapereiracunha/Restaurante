# Sistema de Comunicação de Pedidos em Restaurantes

Sistema desenvolvido com a metodologia **SDD (Spec-Driven Development)** seguindo
o fluxo **Spec Kit**: `constitution.md` → `schema.md` → `plan.md` → `tasks.md` →
implementação.

Resolve o problema de comunicação de pedidos em restaurantes (chamadas verbais,
anotações manuais) substituindo-os por **QR Code por mesa + página web em tempo
real**, sem necessidade de cadastro, login ou app dedicado.

## Documentação do processo SDD

| Etapa Spec Kit | Arquivo | Conteúdo |
|---|---|---|
| Constitution | [`constitution.md`](./constitution.md) | Regras e stack de tecnologia |
| Specify | [`schema.md`](./schema.md) | Modelo de dados derivado dos Requisitos Funcionais |
| Plan | [`plan.md`](./plan.md) | Arquitetura derivada dos Requisitos Não Funcionais |
| Tasks | [`tasks.md`](./tasks.md) | Roadmap de implementação |

## Como funciona

1. Cada mesa tem um **QR Code único** (gerado em `public/qrcodes/`).
2. O cliente escaneia e cai em `/mesa/<código>` — vê o status do pedido em tempo
   real, sem precisar recarregar a página (WebSocket).
3. O garçom/atendente registra o pedido e atualiza o status pelo painel interno
   em `/staff` (protegido por token).
4. Status possíveis: **Aguardando preparo → Em preparo → Pronto para
   retirada/consumo**.

## Requisitos

- Node.js **22.5 ou superior** (usa o módulo nativo `node:sqlite`, sem
  necessidade de compilar dependências nativas).

## Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o STAFF_ACCESS_TOKEN no .env

# 3. Popular o banco com mesas de exemplo (Mesa 1 a Mesa 10)
npm run seed

# 4. Gerar os QR Codes (salvos em public/qrcodes/)
npm run generate-qrcodes

# 5. Subir o servidor
npm start
```

Acesse:
- Cliente: `http://localhost:3000/mesa/<CODIGO_DA_MESA>` (veja os códigos
  impressos pelo `npm run seed` ou os arquivos PNG em `public/qrcodes/`)
- Painel interno: `http://localhost:3000/staff` (use o token definido no `.env`)

## Deploy (Render.com — gratuito, com HTTPS automático)

1. Suba o repositório no GitHub.
2. Em [render.com](https://render.com), crie um **Web Service** apontando para
   o repositório.
3. Configurações:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Variáveis de ambiente:** `STAFF_ACCESS_TOKEN`, `BASE_URL` (URL pública
     gerada pelo Render, ex: `https://seu-app.onrender.com`)
4. Após o primeiro deploy, rode (via Shell do Render ou um job único):
   ```bash
   npm run seed
   npm run generate-qrcodes
   ```
5. Os QR Codes em `public/qrcodes/` apontarão para a URL pública em produção,
   já em HTTPS.

## Estrutura do projeto

```
restaurant-orders/
├── constitution.md      # Etapa 1 do Spec Kit
├── schema.md             # Etapa 2 do Spec Kit
├── plan.md               # Etapa 3 do Spec Kit
├── tasks.md               # Etapa 4 do Spec Kit
├── src/
│   ├── server.js          # Express + Socket.IO
│   ├── db/                # init, queries, seed (node:sqlite)
│   ├── routes/api.js       # API REST
│   └── middleware/staffAuth.js
├── public/
│   ├── mesa.html            # Página do cliente (RF2, RF3, RF6)
│   ├── staff.html            # Painel interno (RF5)
│   ├── styles.css
│   └── qrcodes/                 # QR Codes gerados por mesa (RF1)
└── scripts/generate-qrcodes.js
```

## Requisitos Funcionais atendidos

RF1 (QR Code por mesa), RF2 (página web responsiva), RF3 (status do pedido),
RF4 (atualização automática via WebSocket), RF5 (notificação interna em tempo
real), RF6 (sem login), RF7 (HTTPS em produção), RF8 (multi-dispositivo), RF9
(histórico básico de pedidos).

##Teste
O token de acesso utilizado no painel da cozinha é : cozinha123
Após colocar o codigo crie um pedido 
Volte para painem principal e clique nas mesas testes  de que foi criado o pedido
