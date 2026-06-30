# Tasks.md
## Sistema de Comunicação de Pedidos em Restaurantes

> Etapa 4 do fluxo Spec Kit (SDD) — **Tasks**. Roadmap de implementação gerado a
> partir de `schema.md` e `plan.md`, quebrado em tarefas executáveis na ordem
> recomendada.

## Fase 1 — Setup do Projeto
- [x] T1.1 — Inicializar projeto Node.js (`package.json`)
- [x] T1.2 — Instalar dependências: `express`, `socket.io`, `better-sqlite3`, `qrcode`, `helmet`, `cors`, `dotenv`
- [x] T1.3 — Criar estrutura de pastas (`src/routes`, `src/db`, `src/services`, `public/`)
- [x] T1.4 — Configurar `.env.example` e variáveis de ambiente

## Fase 2 — Banco de Dados (a partir de schema.md)
- [x] T2.1 — Criar script de inicialização do SQLite com as tabelas `tables`, `orders`, `order_items`
- [x] T2.2 — Criar seed inicial com mesas de exemplo (Mesa 1 a Mesa 10) gerando `code` único
- [x] T2.3 — Criar camada de acesso a dados (`db/queries.js`)

## Fase 3 — API REST (a partir de schema.md)
- [x] T3.1 — `GET /api/tables/:code` — retorna dados da mesa
- [x] T3.2 — `GET /api/tables/:code/order` — retorna pedido ativo da mesa
- [x] T3.3 — `POST /api/orders` — cria pedido para uma mesa
- [x] T3.4 — `PATCH /api/orders/:id/status` — atualiza status do pedido (protegido por token de staff)
- [x] T3.5 — `GET /api/staff/orders` — lista pedidos ativos (protegido por token de staff)

## Fase 4 — Tempo Real (a partir de plan.md, RNF3)
- [x] T4.1 — Configurar Socket.IO no servidor
- [x] T4.2 — Implementar rooms por mesa (`table-<code>`) e room `staff`
- [x] T4.3 — Emitir `order:status_updated` ao cliente da mesa quando status muda
- [x] T4.4 — Emitir `staff:new_order` e `staff:status_changed` para o painel interno

## Fase 5 — Frontend Cliente (RF2, RF3, RF6)
- [x] T5.1 — Página `/mesa/:code` em HTML/CSS/JS vanilla, responsiva
- [x] T5.2 — Exibição visual dos 3 estados do pedido (aguardando/preparo/pronto)
- [x] T5.3 — Conexão WebSocket no client-side para atualização automática (sem reload)
- [x] T5.4 — Estado de "reconectando" em caso de queda de conexão

## Fase 6 — Painel Interno de Funcionários (RF5)
- [x] T6.1 — Página `/staff` com login simples por token
- [x] T6.2 — Lista de pedidos ativos com botões de avanço de status
- [x] T6.3 — Alerta visual/sonoro interno quando novo pedido chega ou muda de status

## Fase 7 — Geração de QR Codes (RF1)
- [x] T7.1 — Script `scripts/generate-qrcodes.js` que gera um PNG de QR Code por mesa apontando para `/mesa/:code`
- [x] T7.2 — Salvar QR Codes gerados em `public/qrcodes/`

## Fase 8 — Segurança (RNF1, plan.md)
- [x] T8.1 — Middleware `helmet` para cabeçalhos de segurança
- [x] T8.2 — CORS restrito
- [x] T8.3 — Middleware de autenticação simples por token para rotas `/api/staff/*` e `PATCH status`
- [x] T8.4 — Redirecionamento HTTP→HTTPS habilitado no ambiente de produção

## Fase 9 — Documentação e Entregáveis
- [x] T9.1 — `README.md` com instruções de instalação, execução local e deploy
- [x] T9.2 — Incluir `constitution.md`, `schema.md`, `plan.md`, `tasks.md` no repositório
- [ ] T9.3 — Criar repositório no GitHub e dar push do código (ação do aluno)
- [ ] T9.4 — Deploy em serviço de hospedagem (Render/Railway) e validar HTTPS (ação do aluno)

## Fase 10 — Validação Final (Critérios de Sucesso da Constitution)
- [ ] T10.1 — Testar fluxo completo: escanear QR → ver status → staff muda status → cliente vê em tempo real
- [ ] T10.2 — Testar em pelo menos 2 navegadores/dispositivos diferentes (RNF2)
- [ ] T10.3 — Validar HTTPS ativo em produção (RNF1)
