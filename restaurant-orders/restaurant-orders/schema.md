# Schema.md
## Sistema de Comunicação de Pedidos em Restaurantes

> Etapa 2 do fluxo Spec Kit (SDD) — **Specify**. Este documento é derivado diretamente
> dos Requisitos Funcionais (RF1–RF9) do documento de especificação do projeto e
> define o modelo de dados e os fluxos de informação do sistema, respeitando a
> stack travada em `constitution.md`.

## 1. Rastreabilidade RF → Modelagem

| RF | Requisito | Elemento de schema correspondente |
|---|---|---|
| RF1 | QR Code único por mesa | Entidade `tables` (campo `code`) |
| RF2 | Página web responsiva | Rota `/mesa/:code` (frontend) |
| RF3 | Status do pedido (3 estados) | Entidade `orders` (campo `status`, enum) |
| RF4 | Atualização automática sem reload | Evento WebSocket `order:status_updated` |
| RF5 | Notificação interna para funcionários | Evento WebSocket `staff:new_alert` + painel `/staff` |
| RF6 | Interface simples, sem login | Nenhuma entidade de usuário/cliente é criada |
| RF7 | HTTPS / criptografia | Camada de transporte (não gera entidade, ver `plan.md`) |
| RF8 | Multi-dispositivo | Frontend responsivo vanilla JS (não gera entidade) |
| RF9 | Registro básico de pedidos | Entidade `orders` funciona como histórico (campo `created_at`) |

## 2. Modelo de Dados (Entidade-Relacionamento)

```
TABLES (mesas)
┌──────────────┬──────────┬──────────────────────────────┐
│ id            │ INTEGER  │ PK, autoincrement             │
│ code          │ TEXT     │ UNIQUE — código do QR Code     │
│ label         │ TEXT     │ ex: "Mesa 5"                   │
│ created_at    │ DATETIME │ default now                    │
└──────────────┴──────────┴──────────────────────────────┘
        │ 1
        │
        │ N
ORDERS (pedidos)
┌──────────────┬──────────┬──────────────────────────────────────┐
│ id            │ INTEGER  │ PK, autoincrement                      │
│ table_id      │ INTEGER  │ FK -> tables.id                        │
│ status        │ TEXT     │ ENUM: 'aguardando' | 'preparo' | 'pronto' │
│ description   │ TEXT     │ opcional, anotação livre do pedido     │
│ created_at    │ DATETIME │ default now                            │
│ updated_at    │ DATETIME │ atualizado a cada mudança de status    │
└──────────────┴──────────┴──────────────────────────────────────┘
        │ 1
        │
        │ N
ORDER_ITEMS (itens do pedido) — suporte ao RF9 (registro básico)
┌──────────────┬──────────┬──────────────────────────────┐
│ id            │ INTEGER  │ PK, autoincrement             │
│ order_id      │ INTEGER  │ FK -> orders.id                │
│ item_name     │ TEXT     │ nome do prato/bebida            │
│ quantity      │ INTEGER  │ default 1                       │
└──────────────┴──────────┴──────────────────────────────┘

STAFF_DEVICES (opcional — dispositivos internos, RF5)
┌──────────────┬──────────┬──────────────────────────────┐
│ id            │ INTEGER  │ PK, autoincrement             │
│ device_name   │ TEXT     │ ex: "Tablet Cozinha"           │
│ last_seen_at  │ DATETIME │ heartbeat de presença online   │
└──────────────┴──────────┴──────────────────────────────┘
```

## 3. Enum de Status do Pedido (RF3)

```
'aguardando'  → "Aguardando preparo"
'preparo'     → "Em preparo"
'pronto'      → "Pronto para retirada/consumo"
```

Transições permitidas (máquina de estados linear, sem retrocesso):
```
aguardando → preparo → pronto
```

## 4. Endpoints da API (derivados do schema)

| Método | Rota | Descrição | RF relacionado |
|---|---|---|---|
| GET | `/api/tables/:code` | Retorna dados da mesa pelo código do QR | RF1 |
| GET | `/api/tables/:code/order` | Retorna o pedido ativo da mesa (status atual) | RF2, RF3 |
| POST | `/api/orders` | Cria um novo pedido (uso interno/garçom) | RF9 |
| PATCH | `/api/orders/:id/status` | Atualiza status do pedido (uso interno) | RF3, RF4, RF5 |
| GET | `/api/staff/orders` | Lista pedidos ativos para o painel interno | RF5, RF9 |
| GET | `/api/tables` | Lista mesas cadastradas (admin/seed) | RF1 |

## 5. Eventos WebSocket (Socket.IO)

| Evento | Direção | Payload | RF relacionado |
|---|---|---|---|
| `order:status_updated` | servidor → cliente da mesa específica (room `table-<code>`) | `{ orderId, status }` | RF4 |
| `staff:new_order` | servidor → painel interno (room `staff`) | `{ order }` | RF5 |
| `staff:status_changed` | servidor → painel interno (room `staff`) | `{ orderId, status, tableLabel }` | RF5 |

## 6. Fluxo de Dados (alto nível)

```
[Cliente escaneia QR Code] -> GET /mesa/:code (frontend)
        -> frontend conecta no WebSocket, entra na room "table-<code>"
        -> GET /api/tables/:code/order  → renderiza status atual

[Funcionário/garçom registra pedido] -> POST /api/orders
        -> servidor salva no SQLite (orders + order_items)
        -> emite "staff:new_order" para room "staff"

[Funcionário atualiza status no painel] -> PATCH /api/orders/:id/status
        -> servidor atualiza SQLite
        -> emite "order:status_updated" para room "table-<code>" (cliente vê em tempo real, RF4)
        -> emite "staff:status_changed" para room "staff" (RF5)
```
