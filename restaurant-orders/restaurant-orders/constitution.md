# Constitution.md
## Sistema de Comunicação de Pedidos em Restaurantes

> Etapa 1 do fluxo Spec Kit (SDD). Este documento define as regras, princípios e
> stack de tecnologia que governam todas as decisões técnicas tomadas nas etapas
> seguintes (Specify, Plan, Tasks, Implement). Nenhuma decisão posterior pode
> contradizer o que está definido aqui sem atualizar este arquivo.

## 1. Princípios do Projeto

1. **Simplicidade acima de tudo** — conforme a análise de intervenções do projeto
   original, soluções complexas (apps dedicados, painéis físicos, chamadas de voz)
   foram descartadas. Toda decisão técnica deve favorecer a opção mais simples que
   atenda ao requisito.
2. **Zero fricção para o cliente** — sem cadastro, sem login, sem app para instalar.
   Acesso via QR Code → navegador.
3. **Tempo real sem recarregar a página** — atualização automática de status é
   requisito central (RF4).
4. **Segurança por padrão** — toda comunicação via HTTPS (RF7).
5. **Multiplataforma** — deve funcionar em qualquer navegador moderno, Android,
   iOS, desktop (RF8), sem dependência de loja de aplicativos.
6. **Baixo custo de operação e manutenção** — preferência por stack leve, open
   source, fácil de hospedar em serviços gratuitos/baratos (Render, Railway,
   Vercel, Fly.io).

## 2. Stack de Tecnologia (decisão vinculante)

| Camada | Tecnologia escolhida | Justificativa |
|---|---|---|
| Backend / API | **Node.js + Express** | Leve, simples, grande ecossistema, fácil deploy gratuito |
| Comunicação em tempo real | **Socket.IO (WebSocket)** | Atende RF4 (atualização automática sem reload) com fallback automático |
| Banco de dados | **SQLite** (via `better-sqlite3`) | Zero configuração de servidor de banco, ideal para baixo custo/escala de um restaurante; atende RF9 (registro simples) |
| Geração de QR Code | **biblioteca `qrcode` (Node)** | Gera QR Code único por mesa (RF1) em build/seed time |
| Frontend Cliente | **HTML5 + CSS3 + JavaScript puro (vanilla)** | Sem necessidade de framework pesado; carrega rápido em celular (RF2, RF6) |
| Painel interno (funcionários) | **HTML + JS puro, mesma base do frontend** | Reaproveita stack, evita complexidade de app dedicado |
| Transporte | **HTTPS obrigatório em produção** | Atende RF7 (segurança/criptografia) |
| Hospedagem (deploy) | **Render.com (free tier)** | HTTPS automático, deploy via Git, custo zero para o escopo do projeto |
| Controle de versão | **Git + GitHub** | Repositório público com entregáveis do Spec Kit |

## 3. Regras de Arquitetura

- Arquitetura **monolítica simples**: um único serviço Node.js serve API REST,
  WebSocket e arquivos estáticos do frontend. Não há microsserviços — desnecessário
  para o escopo do problema.
- API segue padrão **REST** para operações CRUD (criação de pedidos, mudança de
  status) e **WebSocket** apenas para push de atualização de status em tempo real.
- Sem autenticação de cliente (conforme RF6). O painel interno de funcionários pode
  ter uma trava simples (PIN/token de restaurante), mas não é cadastro de usuário.
- Identificação da mesa feita por um **código único por mesa** embutido na URL do
  QR Code (`/mesa/:codigo`), não por cookies ou sessão.

## 4. Regras de Código

- JavaScript moderno (ES2020+), `async/await`, sem callbacks aninhados.
- Sem frameworks de frontend pesados (React/Vue) — vanilla JS é suficiente e
  reduz tempo de carregamento em redes móveis de restaurante.
- Código organizado em camadas: `routes/`, `services/`, `db/`.
- Variáveis de ambiente via `.env` (nunca segredos hardcoded).
- Commits e nomes de arquivos em português ou inglês, mas consistentes (optamos
  por **inglês para código, português para documentação**).

## 5. Fora de Escopo (explicitamente descartado)

Conforme a "Evolução da Solução" do documento de requisitos, os itens abaixo
**não devem ser implementados**:
- Chamada por voz.
- Painel físico de senhas (luminoso/eletrônico dedicado).
- Aplicativo mobile nativo dedicado.
- Notificação sonora para o cliente (apenas internamente, para funcionários,
  se necessário).
- Sistema de relatórios complexos/BI — apenas histórico básico (RF9).

## 6. Critérios de Sucesso da Implementação

- Cliente escaneia QR Code → vê status do pedido em < 3 segundos, sem login.
- Status muda automaticamente na tela do cliente sem ação manual.
- Funcionário vê alerta no painel interno assim que o status é alterado.
- Sistema funciona em Chrome/Safari mobile e desktop.
- Toda comunicação roda sobre HTTPS em produção.
