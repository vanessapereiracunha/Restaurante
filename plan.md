# Plan.md
## Sistema de Comunicação de Pedidos em Restaurantes

> Etapa 3 do fluxo Spec Kit (SDD) — **Plan**. Derivado dos Requisitos Não
> Funcionais (RNF) extraídos do documento original e do `schema.md` já definido.
> Define a arquitetura técnica, decisões de implementação, segurança, performance
> e estratégia de deploy.

## 1. Requisitos Não Funcionais (RNF) considerados

Extraídos das seções "Análise das Intervenções", "Reflexão" e dos RFs com caráter
não-funcional do documento original:

| RNF | Descrição | Origem |
|---|---|---|
| RNF1 | Comunicação criptografada (HTTPS) em todas as rotas | RF7 |
| RNF2 | Compatibilidade com Android, iOS e navegadores modernos | RF8 |
| RNF3 | Atualização de status deve ser percebida pelo cliente em tempo real (sem reload, latência alvo < 2s) | RF4 + análise de eficiência |
| RNF4 | Interface deve ser extremamente simples e leve (baixo tempo de carregamento em rede móvel de restaurante) | "Crítica à complexidade" |
| RNF5 | Solução de baixo custo de implementação e manutenção | "Simplificação", "evitar investimentos desnecessários" |
| RNF6 | Sem necessidade de instalação (não é app nativo) | "Substituída por QR Code + página web" |
| RNF7 | Disponibilidade adequada para o horário de funcionamento do restaurante (não é crítico 24/7, mas deve ser estável durante o serviço) | Implícito no domínio |
| RNF8 | Escalabilidade modesta (1 restaurante, dezenas de mesas simultâneas, não milhares) | Escopo do problema |

## 2. Arquitetura Técnica

```
┌─────────────────────┐         HTTPS/WSS          ┌──────────────────────────┐
│  Cliente (celular)   │◄───────────────────────────►│   Servidor Node/Express   │
│  /mesa/:code          │                              │  + Socket.IO               │
└─────────────────────┘                              │  + SQLite (better-sqlite3) │
                                                       └──────────────────────────┘
┌─────────────────────┐         HTTPS/WSS                       ▲
│ Painel interno        │◄────────────────────────────────────────┘
│ /staff (tablet cozinha)│
└─────────────────────┘
```

- Servidor único Node.js (Express) responde tanto à API REST quanto serve os
  arquivos estáticos (frontend cliente e painel interno), seguindo o princípio de
  simplicidade da `constitution.md`.
- Socket.IO mantém conexão persistente para push em tempo real, atendendo RNF3
  sem necessidade de polling (economiza requisições e bateria do celular do
  cliente).
- SQLite roda em arquivo local (`data/database.sqlite`), eliminando custo e
  complexidade de um SGBD externo — atende RNF5.

## 3. Segurança (RNF1)

- Em produção (Render.com), HTTPS é fornecido automaticamente pela plataforma
  (certificado gerenciado) — todo tráfego HTTP é redirecionado para HTTPS.
- Cabeçalhos de segurança via middleware `helmet`.
- CORS restrito ao domínio de produção.
- Painel `/staff` protegido por um token simples de restaurante (variável de
  ambiente `STAFF_ACCESS_TOKEN`), evitando que clientes alterem status de
  pedidos — sem exigir sistema de login completo (mantém RF6/RNF4).
- Nenhum dado pessoal do cliente é coletado (sem nome, telefone, e-mail) —
  reduz superfície de risco e está alinhado a privacidade por padrão.

## 4. Performance e Tempo Real (RNF3, RNF4)

- WebSocket (Socket.IO) ao invés de polling HTTP — atualização instantânea
  (latência tipicamente < 500ms na mesma rede Wi-Fi do restaurante).
- Frontend em HTML/CSS/JS vanilla (sem bundlers pesados) — payload inicial
  pequeno (alvo: < 50KB), carregando rápido mesmo em redes móveis de qualidade
  variável.
- Página de mesa não depende de nenhum recurso externo pesado (sem fontes
  externas grandes, sem frameworks de UI).

## 5. Compatibilidade (RNF2)

- HTML5 + CSS3 com layout responsivo via Flexbox/Grid (sem prefixos
  proprietários necessários — testado mentalmente contra navegadores modernos
  de iOS Safari e Android Chrome).
- Socket.IO possui fallback automático para long-polling em navegadores/redes
  que bloqueiam WebSocket puro, garantindo funcionamento mesmo em Wi-Fi
  corporativo restritivo.
- Nenhuma funcionalidade depende de recursos nativos exclusivos (câmera,
  notificações push nativas) — o QR Code é lido pelo próprio app de câmera do
  celular, sem app dedicado.

## 6. Estratégia de Deploy (RNF5, RNF7)

| Etapa | Ferramenta |
|---|---|
| Hospedagem | Render.com (Web Service, free/starter tier) |
| Build | `npm install` |
| Start | `npm start` (`node src/server.js`) |
| Persistência | Volume de disco do Render para o arquivo SQLite (ou regeneração via seed em cada deploy, dado o baixo risco de perda de "histórico básico" — RF9) |
| HTTPS | Automático via Render |
| Variáveis de ambiente | `STAFF_ACCESS_TOKEN`, `PORT` |
| Domínio | Subdomínio gratuito `*.onrender.com` |

## 7. Escalabilidade (RNF8)

- Escopo é um único restaurante com até ~50 mesas simultâneas — dentro da
  capacidade confortável de uma instância Node única com SQLite.
- Caso o sistema precise crescer para múltiplos restaurantes, o `plan.md`
  recomenda (fora do escopo atual) migrar para PostgreSQL e adicionar
  `restaurant_id` a todas as entidades — não implementado agora, por violar o
  princípio de simplicidade da constitution para o escopo atual.

## 8. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Queda de Wi-Fi do restaurante | Socket.IO reconecta automaticamente; frontend exibe "Reconectando..." |
| Cliente fecha a aba | Estado fica salvo no servidor; cliente pode reescanear o QR Code a qualquer momento e ver o status atual |
| Funcionário muda status errado | Botões de ação no painel interno claramente rotulados, com confirmação visual (não há requisito de desfazer no escopo atual) |
