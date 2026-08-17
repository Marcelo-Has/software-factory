# EVP1-PLANO-EXECUCAO.md — Repo genérico + porte do núcleo

> **Status: plano publicado (Sessão 1 / Fable, 2026-08-17). Nada foi executado.**
> Entradas: `claude/STATE.md` · `claude/EV-PIVOT-PLANO.md` (v2) · inventário real do repo
> antigo (`J:\Projects\personal-gift-project`, lido nesta sessão: `.claude/`, `.github/`,
> `bench/`, `docs/`, `tests/`, raiz; `FACTORY-INVENTORY.md` como índice de partida) ·
> decisões A1–A12 da classificação (via STATE/plano; não reli o arquivo histórico inteiro).
>
> **Escopo do EVP1:** criar o repo genérico com a hierarquia `factory/` × `project/` ×
> `app/` e portar as peças do §6 do plano vigente — EN, paths novos, DP-5/F1/F2 resolvidos
> no porte, CI rodando "vazio" e harness verde. **Fora de escopo (é EVP2+):** skills D0–D6,
> `/fabric-init`, módulos de perfil formalizados, templates de artefatos da Fase D além dos
> que já existem no repo antigo.

## 0. Decisões de planejamento fixadas AQUI (Sonnet não re-decide)

Sonnet executa; impasse novo → pausa e chat Fable curto (GUIA-DE-SESSOES §6). As decisões
abaixo já estão tomadas nesta sessão de planejamento:

1. **DP-5 (fonte única de papel) — resolvido assim no porte:**
   - Papéis executados como **subagentes nativos** do Claude Code (`developer-frontend`,
     `developer-backend`, e o próprio `developer-lead` quando invocado numa sessão):
     `.claude/agents/*.md` **é a fonte de execução** (é o mecanismo nativo).
   - Papéis executados **por workflow com prompt inline** (reviewer, security, verdict,
     refiner, design-critic, supervisor, daily-report): o **prompt inline no `.yml` é a
     fonte única**; o `.claude/agents/<papel>.md` correspondente vira **role card
     derivado**, com cabeçalho padrão `> Role documentation only — the executable prompt
     lives in .github/workflows/<file>.yml. Never edit behavior here.` Nunca duas fontes
     (viés registrado na A10).
   - Registrar como **D-002** no `DECISIONS.md` novo (numeração própria do repo, em EN).
2. **F1 (rede no builder):** o contrato do `developer-lead` (e o prompt do `implement.yml`)
   ganha o teste explícito: *"Does the issue contain verifiable acceptance criteria? If
   not → outcome 3 (decision-needed), never 'general improvements'."* O cenário C5 do
   harness passa a afirmar exatamente isso.
3. **F2 (retry de infra):** `review.yml`, `security.yml`, `verdict.yml` e
   `design-critic.yml` ganham **1 re-execução automática** quando a falha é de infra
   distinguível (padrões de rede/TLS/5xx no log), preservando o fail-closed (sem veredito
   → vermelho continua). `fix.yml` continua observando só o CI — limitação conhecida,
   registrada, não tratada no EVP1.
4. **Convenções do repo novo:** vocabulário `D-xxx`/`FU-xx` mantido com glossário (A8);
   `DECISIONS.md` nasce zerado em EN com numeração própria (A11) — D-001 = a decisão do
   porte/bootstrap; cicatrizes históricas: mantém a lição, remove o número da issue de
   origem (A9); `claude-code-review.yml.disabled` é **descartado** com o porquê registrado
   (A5); labels em EN (`entrega:*` → `delivery:*`).
5. **Peças stack-specific** (Stylelint config, seletor Svelte do lint-antipatterns, adapter
   Netlify de preview): portam como **matéria-prima** em `factory/profiles/` com README
   marcando "raw material — formalized as profile modules in EVP2". EVP1 não desenha o
   contrato de módulo.

## 1. Bootstrap do repo no GitHub (checklist do dono, ~10 min)

Pré-requisitos: `gh auth status` ok · Node 20+ local. Sugestão de nome: `software-factory`.

```bash
# ── Variáveis ────────────────────────────────────────────────────────────────
OWNER=<seu-usuario-github>
REPO=software-factory

# ── 1. Criar o repo (privado, com README, clonando já) ───────────────────────
gh repo create "$OWNER/$REPO" --private --add-readme \
  --description "Autonomous software factory — generic core (template repo)" --clone
cd "$REPO"

# ── 2. Marcar como TEMPLATE (duplicar a fábrica = clonar o template) ─────────
gh repo edit "$OWNER/$REPO" --template
# fallback se a flag não existir na sua versão do gh:
# gh api -X PATCH "repos/$OWNER/$REPO" -F is_template=true

# ── 3. Labels (EN). Fonte de verdade final = grep dos workflows na sessão S4;
#      este é o superset de partida, espelhando a coreografia atual ───────────
gh label create "status:ready"        -c 0e8a16 -d "Spec complete; builder may start"
gh label create "status:blocked"      -c d93f0b -d "Blocked by dependency or gate"
gh label create "refine:requested"    -c fbca04 -d "Opt-in: refiner completes the spec with the owner"
gh label create "decision-needed"     -c b60205 -d "Decision Gate: owner must decide"
gh label create "delivery:complete"   -c 0e8a16 -d "Builder claims full delivery"
gh label create "delivery:incomplete" -c fbca04 -d "Partial delivery; verdict will judge"
gh label create "area:frontend"       -c 1d76db -d "Touches UI paths (triggers design flow)"
gh label create "area:backend"        -c 5319e7 -d "Domain, data, integrations"
gh label create "area:factory"        -c c2e0c6 -d "Factory itself (workflows, agents, gates)"

# ── 4. Permissões do Actions (o workflow abre PR; app/claude como autor) ─────
gh api -X PUT "repos/$OWNER/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true

# ── 5. Secrets/variables. No EVP1 o CI é 100% determinístico (harness + gates
#      de idioma) — nenhum secret de IA é NECESSÁRIO para o gate de conclusão.
#      Criar já se quiser deixar os workflows de IA prontos (decisão oauth × API
#      key fica para o EVP3, §9 do plano vigente):
gh secret set CLAUDE_CODE_OAUTH_TOKEN   # ou: gh secret set ANTHROPIC_API_KEY
gh variable set FACTORY_AUTH --body "oauth"   # toggle D-016; semântica exata
                                              # é conferida no porte do implement.yml (S4)

# ── 6. Branch protection — EM DOIS TEMPOS. Aplicar DEPOIS que o primeiro CI
#      rodar (os contexts precisam existir). Rodar após a sessão S1: ──────────
cat > /tmp/protection.json <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["factory-tests", "english-only", "boundary-check"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
gh api -X PUT "repos/$OWNER/$REPO/branches/main/protection" --input /tmp/protection.json
# (nomes dos contexts = nomes dos jobs do ci.yml criados na S1/S5; ajustar se mudarem.
#  Isto corrige desde o nascimento o follow-up "required checks" pendente no repo antigo.)
```

Depois do bootstrap: abrir o repo novo no VSCode e rodar as sessões Sonnet da §3, em ordem.
O repo antigo (`J:\Projects\personal-gift-project`) fica acessível no mesmo disco — os
prompts referenciam esse caminho como fonte de leitura (nunca de escrita).

## 2. Mapa de porte arquivo a arquivo

Legenda: **muda** = além de traduzir para EN, o que se altera (paths novos, generalização,
DP-5/F1/F2). "Fica" = permanece no repo antigo, fora do genérico. Fonte: árvore real lida
em 2026-08-17 + `FACTORY-INVENTORY.md`.

### 2.1 Raiz do repo antigo

| Origem | Destino (EN) | Muda |
|---|---|---|
| `CLAUDE.md` | `CLAUDE.md` | **Reescrito** (não traduzido): entrypoint enxuto da fábrica genérica; aponta para `factory/docs/FACTORY.md`, regra de ouro da fronteira (fábrica só escreve em `project/` e `app/`), papéis, glossário D/FU |
| `REPO-STRUCTURE.md` | `factory/docs/REPO-STRUCTURE.md` | Reescrito para a hierarquia `factory/` × `project/` × `app/` + convenções `.claude/` |
| `DESIGN.md` ("Tinta de Esferográfica") | **não porta** | Vira **exemplo citado** no template de DESIGN (R-SAMPLES) — citado, nunca copiado |
| `package.json` / `package-lock.json` | novo `package.json` mínimo na raiz | Só deps do harness e dos gates (vitest, playwright p/ screenshots, stylelint, lighthouse etc. conforme S5 apurar); nada de deps do produto |
| `stylelint.config.js` | `factory/profiles/frontend/sveltekit/stylelint.config.js` | Matéria-prima de perfil (decisão §0.5); regras de token genéricas ficam comentadas como tal |
| `eslint.config.js`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, `netlify.toml`, `Dockerfile`, `firebase.json`, `firestore.rules`, `storage.rules`, `.env.example` | **ficam** | Produto/stack; viram referência dos módulos de perfil no EVP2 |
| `src/`, `worker/`, `e2e/`, `design/assets/`, `artefatos-execucao/`, `artifacts/`, `build/`, `test-results/`, `README.md`, `HELLO.md` | **ficam** | Produto e execução do produto. A estrutura `design/assets/` renasce como parte do `/init` no EVP2 (R-ASSETS) |

### 2.2 `.claude/` (config, papéis, rules, skills)

| Origem | Destino (EN) | Muda |
|---|---|---|
| `.claude/settings.json` | `.claude/settings.json` | Hooks `PreToolUse` intactos (guard-rail de execução); paths de permissão `src/**` → `app/**`, `project/**`; deny em `factory/**` para sessões de produto (fronteira dura) |
| `.claude/settings.local.json.example` | idem | EN |
| `agents/developer-lead.md` | `agents/developer-lead.md` | EN; paths; **+ cláusula F1** (§0.2); contrato-base do builder (PR-first, 3 desfechos, D-019, D-047) intacto |
| `agents/developer-frontend.md` | `agents/developer-frontend.md` | EN; paths (`app/web`); Visual Verification Loop aponta para `project/design/DESIGN.md` + mockups; **fonte de execução** (subagente nativo — DP-5 §0.1) |
| `agents/developer-backend.md` | `agents/developer-backend.md` | EN; paths (`app/api`, `app/worker`); fonte de execução (idem) |
| `agents/design-director.md` | `agents/design-director.md` | EN; escreve em `project/design/`; Decision Gate de identidade intacto |
| `agents/design-critic.md` | `agents/design-critic.md` | EN; vira **role card derivado** (executa via `design-critic.yml` — DP-5) |
| `agents/refiner.md` | `agents/refiner.md` | EN; role card derivado (`refine.yml`); Spec Gate/2 rodadas/decidido×assumido intactos |
| `agents/reviewer.md` | `agents/reviewer.md` | EN; role card derivado (`review.yml`); read-only D-033 |
| `agents/verdict.md` | `agents/verdict.md` | EN; role card derivado (`verdict.yml`); D-037 fail-closed |
| `agents/supervisor.md` | `agents/supervisor.md` | EN; role card derivado (`supervisor.yml`, religável) |
| `rules/design-antipatterns.md` | `rules/design-antipatterns.md` | EN; `paths:` de UI → `app/web/**` |
| `rules/right-sizing.md` | `rules/right-sizing.md` | EN |
| `rules/security.md` | `rules/security.md` | EN; itens Firebase generalizados ("BaaS security rules do perfil ativo") |
| `rules/testing.md` | `rules/testing.md` | EN; comandos concretos delegados ao perfil |
| `rules/payments.md` | **não porta** | Produto (Stripe/preço). Lição genérica ("preço é Decision Gate") vai para `factory/docs/AUTONOMY.md` |
| `rules/product-skills.md` | **não porta** | Produto (registry de estilos do runtime) |
| `skills/answer-decision/` | `skills/answer-decision/` | EN; grava no `DECISIONS.md` novo |
| `skills/fix-ci/` | `skills/fix-ci/` | EN; referência D-014 vira lição sem número de issue (A9) |
| `skills/harden-workflows/` | `skills/harden-workflows/` | EN; pin por SHA etc. intactos |
| `skills/new-issue/` | `skills/new-issue/` | EN; template EN, labels EN |
| `skills/triage-pr/` | `skills/triage-pr/` | EN |
| `skills/pause/` · `skills/resume/` | idem | EN; lista de workflows atualizada aos nomes novos |
| `skills/design-foundation/` | `skills/design-foundation/` | EN; paths para `project/design/`; **cabeçalho-flag**: será reformulada como `/design-foundation` (D4) no EVP2 |
| `skills/new-style/` | **não porta** | Runtime do produto |

### 2.3 `.github/workflows/` (a coreografia dos 2 regimes)

Todos: EN completo (nome, comentários, mensagens), labels EN, `working-directory`/`paths:`
para `app/**`, e as cirurgias DP-5/F1/F2 da §0.

| Origem | Destino | Muda além do padrão acima |
|---|---|---|
| `ci.yml` | `ci.yml` | Jobs de produto (lint/test/build do app) condicionados a existir `app/` com código (`if` determinístico — CI roda "vazio" no EVP1); **+ jobs novos**: `no-portuguese`, `boundary-check`, `factory-tests` (harness) |
| `implement.yml` | `implement.yml` | Prompt inline = envelope; papel do lead vem do subagente nativo (DP-5 §0.1); **F1** no prompt; toggle `FACTORY_AUTH` (D-016) conferido e documentado |
| `review.yml` | `review.yml` | **F2**: retry 1× em falha de infra distinguível; step de publicação não-IA (D-034) intacto |
| `security.yml` | `security.yml` | **F2**; scans de dependência/segredo genéricos mantidos; scans de stack → perfil (EVP2) |
| `verdict.yml` | `verdict.yml` | **F2**; D-037 fail-closed + julgamento por `head_sha` (D-033/D-042) intactos |
| `fix.yml` | `fix.yml` | Sem mudança de desenho; nota de limitação (só observa CI) |
| `refine.yml` | `refine.yml` | Opt-in por label `refine:requested`; OWNER-gate; máx. 2 rodadas |
| `claude.yml` | `claude.yml` | OWNER-gate intacto (anti-F3) |
| `daily-report.yml` | `daily-report.yml` | Filtro `jq` da re-entrada preservado byte-a-byte na lógica (tem teste dedicado); teto D-047/D-087 intactos |
| `supervisor.yml` | `supervisor.yml` | Porta **desligado** (schedule comentado ou `if: false` documentado) — "religável", como manda o §6 do plano |
| `design-critic.yml` | `design-critic.yml` | **F2**; evidência de screenshot obrigatória (reprova de ofício sem evidência); rubrica de `factory/docs/DESIGN-CRITIC-RUBRIC.md` |
| `screenshots.yml` | `screenshots.yml` | Viewports 375/768/1280; obtenção de preview URL isolada num step com adapter (Netlify = 1º adapter, ver scripts) |
| `claude-code-review.yml.disabled` | **descarta** | Registrar o porquê no `DECISIONS.md` novo (A5) |
| `ISSUE_TEMPLATE/factory-task.md` | `ISSUE_TEMPLATE/factory-task.md` | EN; seção "Visual requirements" quando `area:frontend`; padrão do regime Manutenção |

### 2.4 `.github/scripts/` (gates determinísticos — renomear em EN)

| Origem | Destino |
|---|---|
| `gate-design-md.mjs` | `gate-design-md.mjs` — caminho do contrato: `project/design/DESIGN.md` |
| `lint-antipatterns.mjs` | `lint-antipatterns.mjs` — núcleo genérico; seletores Svelte extraídos para bloco marcado "profile extension point" |
| `lighthouse-a11y.mjs` | `lighthouse-a11y.mjs` |
| `screenshots.mjs` | `screenshots.mjs` |
| `aguardar-screenshots.mjs` | `await-screenshots.mjs` |
| `conferir-evidencia.mjs` | `check-visual-evidence.mjs` |
| `rotas-de-ui.mjs` | `ui-routes.mjs` — descoberta de rotas parametrizada por perfil (SvelteKit = 1º caso) |
| `netlify-preview-url.mjs` | `preview-url.mjs` — Netlify vira o 1º adapter interno; interface neutra |
| `unir-passadas-critic.mjs` | `merge-critic-passes.mjs` |
| `veredito-critic.mjs` | `critic-verdict.mjs` |

### 2.5 `docs/` → `factory/docs/` + `factory/templates/`

| Origem | Destino (EN) | Muda |
|---|---|---|
| `docs/ARCHITECTURE.md` (Parte 1, fábrica) **+ Project `claude/FACTORY-FLOW.md`** | `factory/docs/FACTORY.md` | **Consolidação A12**: um doc-core único da coreografia (papéis, regimes G/M, guard-rails, glossário FU/D). Parte 2 (produto) fica. O dono cola o FACTORY-FLOW no repo antes da S2 (sessão VSCode não enxerga o Project) |
| `docs/AUTONOMY.md` | `factory/docs/AUTONOMY.md` | EN; framework de Decision Gates genérico; gates de produto (D-100…D-106) ficam; absorve "price is a Decision Gate" |
| `docs/DECISIONS.md` | **não porta** (333 KB de história do produto+fábrica) | Repo novo nasce com `DECISIONS.md` zerado em EN (D-001 = bootstrap/porte; D-002 = DP-5; numeração própria — A11). Lições viradas regra (placar antes do disparo, orçamento de turnos explícito, medir antes de fixar teto, PoC antes de plataforma) entram como seção "Operating lessons" do `FACTORY.md` |
| `docs/FACTORY-INVENTORY.md` | **não porta** (fotografia do repo antigo) | S6 gera `factory/docs/INVENTORY.md` novo, do repo novo |
| `docs/PRODUCT.md`, `docs/ROADMAP.md` | **ficam** | ROADMAP obrigatório vira contrato do core (A2): `factory/templates/ROADMAP-template.md` extraído da estrutura do atual |
| `docs/DEPLOY-WORKER.md` | **fica** | Referência futura do módulo cloud-run (EVP2) |
| `docs/design/CRAFT-PRINCIPLES.md` | `factory/docs/CRAFT-PRINCIPLES.md` | EN |
| `docs/design/DESIGN-CRITIC-RUBRIC.md` | `factory/docs/DESIGN-CRITIC-RUBRIC.md` | EN; rubrica 7 dimensões × severidade + 3 pilares + teste "could this have come from any similar prompt?" |
| `docs/design/SKILL-ROUTER.md` | `factory/docs/SKILL-ROUTER.md` | EN; ordem de autoridade das skills |
| `docs/design/playbooks/` (README, `saas-dashboard`, `institucional-marketing`, `editorial`, `data-heavy`, `mobile`) | `factory/docs/playbooks/` (`institutional-marketing.md` e demais em EN) | EN; exemplos do produto viram "example from the origin project" (A9) |
| `docs/design/DESIGN-TEMPLATE.md` | `factory/templates/DESIGN-template.md` | EN; R-SAMPLES: cita o DESIGN.md "Ballpoint Ink" do repo de origem como exemplo real (citado, nunca copiado) |
| `docs/design/BRAND-ASSETS.md` | `factory/templates/BRAND-ASSETS-template.md` | EN; instância viva nasce em `project/design/` no `/init` (EVP2) |
| `docs/design/VARIETY-REGISTRY.md` | `factory/templates/VARIETY-REGISTRY-template.md` | EN; instância viva em `project/state/` |

### 2.6 `bench/` + `tests/` → `factory/bench/` (o harness)

| Origem | Destino (EN) | Muda |
|---|---|---|
| `bench/README.md` | `factory/bench/README.md` | EN |
| `bench/coleta.md` | `factory/bench/collection.md` | EN; mecanismo de transcrição/custo (D-024/D-090) descrito de forma genérica |
| `bench/rubricas.md` | `factory/bench/rubrics.md` | EN |
| `bench/cenarios/C1-catalogo.md` | `factory/bench/scenarios/C1-catalog-page.md` | EN; generalizado (produto → exemplo citado) |
| `bench/cenarios/C2-como-funciona.md` | `factory/bench/scenarios/C2-explainer-page.md` | EN; idem — é o cenário do baseline de design 1,5/4 |
| `bench/cenarios/C3-bug-plantado.md` | `factory/bench/scenarios/C3-planted-bug.md` | EN |
| `bench/cenarios/C4-gate-trap.md` | `factory/bench/scenarios/C4-gate-trap.md` | EN |
| `bench/cenarios/C5-ambigua.md` | `factory/bench/scenarios/C5-ambiguous-spec.md` | EN; **passa a afirmar a cláusula F1** (recusa de spec vaga = desfecho 3) |
| `tests/design/*.test.ts` (`antipatterns`, `critic-passadas`, `estados`, `estilo`, `tokens`, `veredito-critic`) | `factory/bench/tests/design/` (`antipatterns`, `critic-passes`, `states`, `style`, `tokens`, `critic-verdict`).test.ts | EN; apontam para os scripts renomeados (§2.4) |
| `tests/design/fixtures/*` (violações plantadas, `LEIA-ME.md`) | `factory/bench/tests/design/fixtures/*` (EN, `README.md`) | Fixtures Svelte mantidas como 1º caso de perfil; nomes EN (`antipatterns-clean.svelte`, `tokens-violated.css`, `verdict-approved.md`…) |
| `tests/design/a11y-baseline.json` | `factory/bench/tests/design/a11y-baseline.json` | — |
| `tests/hooks/pretooluse.test.ts` | `factory/bench/tests/hooks/pretooluse.test.ts` | Alimenta os hooks do `settings.json` novo (não pode voltar a ficar inerte) |
| `tests/workflows/reentrada.test.ts` | `factory/bench/tests/workflows/reentry.test.ts` | Executa o filtro `jq` real do `daily-report.yml` novo |
| `tests/workflows/design-md.test.ts` | `factory/bench/tests/workflows/design-md.test.ts` | 22 casos preservados; paths novos |
| `tests/workflows/evidencia-visual.test.ts` | `factory/bench/tests/workflows/visual-evidence.test.ts` | EN |
| `tests/workflows/screenshots.test.ts` | `factory/bench/tests/workflows/screenshots.test.ts` | EN |
| `tests/rules/*.rules.test.ts` (Firestore/Storage) | **ficam** | Produto/Firebase; referência do módulo firebase no EVP2 |
| — | `vitest.config.ts` (raiz, novo) | Aponta para `factory/bench/tests/**`; comando único `npm test` = harness |

### 2.7 Estrutura-alvo ao fim do EVP1

```
software-factory/
├── CLAUDE.md                      # entrypoint EN (reescrito)
├── DECISIONS.md                   # zerado, EN, D-001…
├── package.json · vitest.config.ts
├── .claude/                       # settings + 9 agents + 4 rules + 8 skills (EN)
├── .github/
│   ├── ISSUE_TEMPLATE/factory-task.md
│   ├── scripts/                   # 10 gates EN (§2.4) + english-only.mjs + boundary-check.mjs
│   └── workflows/                 # 12 workflows EN (§2.3)
├── factory/
│   ├── docs/                      # FACTORY.md · AUTONOMY.md · CRAFT-PRINCIPLES.md ·
│   │   └── playbooks/             #   DESIGN-CRITIC-RUBRIC.md · SKILL-ROUTER.md ·
│   │                              #   REPO-STRUCTURE.md · INVENTORY.md (S6)
│   ├── templates/                 # DESIGN · BRAND-ASSETS · VARIETY-REGISTRY · ROADMAP
│   ├── profiles/                  # README + frontend/sveltekit/ (matéria-prima)
│   ├── checklists/                # README placeholder (conteúdo real = EVP2)
│   └── bench/                     # README · collection · rubrics · scenarios/ · tests/
├── project/                       # vazio: README + .gitkeep por subpasta (docs/ design/ state/)
└── app/                           # vazio: README + .gitkeep (web/ api/ worker/ nascem por perfil)
```

## 3. Sequência de sessões Sonnet (Claude Code no VSCode, repo novo)

Regras comuns a TODOS os prompts (o preâmbulo abaixo abre cada sessão):

```
Contexto: this is the generic autonomous software factory repo (EVP1 port). Source repo
(READ-ONLY) : J:\Projects\personal-gift-project — never write there. Everything you write
here is 100% ENGLISH (docs, comments, commits, messages) — no Portuguese anywhere.
Small, auditable commits (conventional messages). Do not improvise beyond this prompt:
out-of-scope findings go into a final session report, not into the diff. If you hit an
architecture/contract decision not settled below: STOP and report — the owner takes it
to a planning chat. Port = translate + adapt paths, preserving the LOGIC byte-for-byte
unless this prompt explicitly orders a change.
```

### S1 — Esqueleto + gates de idioma e fronteira
**Modo:** Edit automatically. **Depende de:** bootstrap §1 feito (repo clonado).

```
[preâmbulo]
Task: scaffold this repo per §2.7 of the execution plan (structure pasted below / in
docs/_port-input/EVP1-PLANO-EXECUCAO.md). Create: full directory tree with README.md per
top-level dir stating its contract (factory/ = immutable per project; project/ and app/ =
the only places the factory writes); rewritten CLAUDE.md (lean EN entrypoint: golden rule,
role map, pointer to factory/docs/FACTORY.md, D/FU glossary stub); DECISIONS.md with
D-001 (bootstrap + port decision, EN, own numbering); root package.json (vitest only for
now) + vitest.config.ts targeting factory/bench/tests; .github/scripts/no-portuguese.mjs
(fails on Portuguese content in CLAUDE.md, DECISIONS.md, .claude/, .github/, factory/ —
regex: accented PT chars [ãõáéíóúâêôç] case-insensitive + curated word list (que, não,
função, também, deve, para que, exemplo…) with a tiny allowlist file for cited proper
names); .github/scripts/boundary-check.mjs (fails if factory/**, .claude/** or .github/**
references src/, worker/, "nossa", "historia", "gift", "personal-gift", firebase project
ids, netlify site ids from the origin repo); minimal .github/workflows/ci.yml with jobs
no-portuguese, boundary-check, factory-tests (vitest — passes empty for now).
Validation before you finish: (a) plant a PT sentence in a factory/ file and show the
gate failing, then remove it (planted-violation tradition); (b) same for a boundary
violation; (c) npm test green; (d) ci.yml passes actionlint locally if available.
```
**Critério de validação da onda:** CI verde no GitHub com os 3 jobs; os 2 gates provados
com violação plantada; árvore §2.7 existe. → Dono aplica a branch protection (§1 passo 6).

### S1.1 — Redesenho do gate de idioma: `no-portuguese` → `english-only`
**Modo:** Edit automatically. **Contexto:** ajuste decidido pelo dono após a S1 (a regra
"sem português" parecia arbitrária para futuros usuários do template; o requisito real é
R-EN — "o core é inglês"). Mesma proteção, enquadramento genérico.

```
[preâmbulo]
Task: refactor the language gate created in S1 from "no-portuguese" to "english-only" —
same guard-rail, generic framing (planning decision already made by the owner).
(1) Rename .github/scripts/no-portuguese.mjs → english-only.mjs. (2) TWO detection
layers: LAYER A (generic) — flag any non-ASCII LETTER (Unicode letters outside A–Za–z;
punctuation like em-dashes/curly quotes is fine) in the covered paths; catches PT, ES,
FR, DE etc. with one rule. LAYER B (origin-specific) — curated PORTUGUESE stopword list
for unaccented words Layer A cannot see (para, como, deve, ainda, sempre, depois,
entre…), whole-word, case-insensitive. (3) Single allowlist file (cited proper names,
e.g. "Tinta de Esferográfica") applied to BOTH layers. (4) Script header explains the
design: "The factory core is English-only (R-EN). Layer B targets Portuguese because
that is the origin language this core was ported from — extend the wordlist if your
fork's contributors drift in another language." (5) Coverage unchanged: CLAUDE.md,
DECISIONS.md, .claude/, .github/, factory/ — NEVER project/ or app/. (6) ci.yml: rename
job no-portuguese → english-only. (7) Record the redesign as the next DECISIONS.md entry.
Validation: plant one violation per layer (accented non-PT word for A; unaccented PT
sentence for B), show both failing, remove; npm test green; report final CI job names.
```
**Critério:** gate renomeado com 2 camadas provadas por violação plantada (1 por camada);
entrada no DECISIONS.md; dono re-aplica a branch protection com o context `english-only`.
Referências a `no-portuguese` nas sessões seguintes deste plano leem-se `english-only`.

### S2 — Docs core + templates (`factory/docs/` + `factory/templates/`)
**Modo:** Edit automatically. **Antes:** o dono copia o conteúdo de `claude/FACTORY-FLOW.md`
(Project) para `docs/_port-input/FACTORY-FLOW.md` no repo novo (sessão VSCode não enxerga
o Project); pasta `_port-input/` é apagada na S6.

```
[preâmbulo]
Task: port the core docs per §2.5 of the execution plan. (1) factory/docs/FACTORY.md =
consolidation of docs/ARCHITECTURE.md Part 1 (factory) from the source repo +
docs/_port-input/FACTORY-FLOW.md — ONE canonical description of the choreography (roles,
Generation/Maintenance regimes, non-AI guard-rails D-019/D-034/D-037/D-047/D-087/D-033/
D-042 as a table with the lesson behind each, FU/D glossary, "Operating lessons" section:
scoreboard before dispatch, explicit turn budget, measure before fixing caps, PoC before
platform choice). (2) AUTONOMY.md → factory/docs/ (generic Decision Gate framework;
product gates stay behind; add "price/money-touching changes are a Decision Gate" as a
generic example). (3) CRAFT-PRINCIPLES, DESIGN-CRITIC-RUBRIC, SKILL-ROUTER, playbooks/
(6 files, institucional-marketing → institutional-marketing) → factory/docs/, EN,
product examples become "example from the origin project" without issue numbers.
(4) Templates → factory/templates/: DESIGN-template.md (cite origin repo's "Ballpoint
Ink" DESIGN.md as the real example — cited, NEVER copied), BRAND-ASSETS-template.md,
VARIETY-REGISTRY-template.md, ROADMAP-template.md (extract structure from source
docs/ROADMAP.md, strip all product content).
Validation: english-only + boundary gates green over the new files; every template has
a "How to instantiate" header; FACTORY.md contains all 8 guard-rail IDs.
```
**Critério:** CI verde; FACTORY.md único e completo (8 guard-rails nomeados); 4 templates
com exemplo/instrução (R-SAMPLES).

### S3 — Papéis, rules e skills (`.claude/`)
**Modo:** Edit automatically (contratos são texto; diff revisável no PR).

```
[preâmbulo]
Task: port .claude/ per §2.2 of the execution plan. settings.json: keep PreToolUse hooks
logic identical; permission paths src/** → app/**, project/**. Agents (9): translate,
retarget paths. TWO surgical changes ordered by the plan: (a) developer-lead.md gains the
F1 clause — "Before implementing: does the issue contain verifiable acceptance criteria?
If not → outcome 3 (decision-needed). Vague spec is never a license for general
improvements."; (b) DP-5 header discipline — developer-lead, developer-frontend,
developer-backend, design-director keep full executable contracts (native subagents);
reviewer, verdict, refiner, supervisor, design-critic get the derived role-card header
("Role documentation only — the executable prompt lives in .github/workflows/<file>.yml")
with a short role summary, no duplicated executable instructions. Rules: port
design-antipatterns, right-sizing, security (generalize Firebase mentions to "the active
profile's BaaS rules"), testing; do NOT port payments/product-skills. Skills: port
answer-decision, fix-ci, harden-workflows, new-issue, triage-pr, pause, resume (update
workflow name list), design-foundation (add header: "to be reshaped as /design-foundation
(D4) in EVP2"); do NOT port new-style. Record D-002 (DP-5 resolution) in DECISIONS.md
exactly as specified in the plan §0.1.
Validation: gates green; grep proves no agent file both has a role-card header AND
executable step lists (single source per role).
```
**Critério:** CI verde; F1 presente no lead; D-002 registrado; papéis com fonte única.

### S4 — Workflows + scripts (`.github/`)
**Modo:** **Plan primeiro, depois Edit automatically** (é a peça mais sensível do porte;
o dono lê o plano da sessão antes do edit).

```
[preâmbulo]
Task: port .github/ per §2.3–2.4 of the execution plan. Scripts first (10 files, new EN
names per the §2.4 table; logic byte-for-byte except: gate-design-md targets
project/design/DESIGN.md; lint-antipatterns isolates Svelte selectors in a marked
"profile extension point" block; preview-url.mjs wraps Netlify as first adapter behind a
neutral interface). Then the 12 workflows (EN, labels per bootstrap list, paths app/**,
working-directory where needed): implement (DP-5: inline prompt is the run envelope, the
lead's contract lives in the native subagent; F1 line in the prompt; verify FACTORY_AUTH
toggle semantics and document in the workflow header), review/security/verdict/
design-critic (+F2: one automatic re-run when the failure log matches distinguishable
infra patterns — network/TLS/5xx — keeping fail-closed), fix, refine (opt-in label
refine:requested, OWNER gate, max 2 rounds), claude (OWNER gate), daily-report (preserve
the jq re-entry filter logic exactly — it has a dedicated test), supervisor (ported
DISABLED: schedule commented, header explains how to re-enable), screenshots (375/768/
1280; preview step uses the adapter), ci.yml completed (product jobs behind a
deterministic "app has code" condition so CI runs green on the empty skeleton). Discard
claude-code-review.yml.disabled and record why as a DECISIONS.md entry. Reconcile labels:
grep every label string used across workflows and output the definitive list vs the
bootstrap set — report any diff, and align workflows to the EN label names.
Validation: actionlint clean on all 12; gates green; label reconciliation table in the
session report; grep shows zero references to netlify-only logic outside the adapter.
```
**Critério:** 12 workflows EN + actionlint limpo; F2 visível nos 4 workflows de veredito;
CI do repo (ainda sem harness completo) verde; tabela de labels reconciliada.

### S5 — Harness (`factory/bench/`) + CI completo verde
**Modo:** Edit automatically.

```
[preâmbulo]
Task: port the harness per §2.6 of the execution plan. bench docs (README, collection,
rubrics) EN; scenarios C1–C5 with new EN names, generalized (product references → "example
from the origin project"; C5 now asserts the F1 clause: vague spec must end in outcome 3).
Port tests: design/ (6 tests + fixtures with EN names + a11y-baseline.json), hooks/
(pretooluse against the NEW settings.json), workflows/ (reentry, design-md 22 cases,
visual-evidence, screenshots) into factory/bench/tests/**, pointing at the renamed
scripts of §2.4. Add whatever devDependencies the tests genuinely need to root
package.json (nothing product-related). Do NOT port tests/rules (Firebase — stays with
the product). Wire factory-tests job to run the full suite.
Validation: npm test FULLY GREEN locally and in CI on the empty skeleton; the planted
violations still fail their gates (fixtures prove the gates bite); no test references
src/ or product paths.
```
**Critério:** **harness 100% verde no CI com `app/` vazio** — o coração do gate do EVP1;
violações plantadas continuam mordendo.

### S6 — Varredura final + inventário + relatório
**Modo:** Auto.

```
[preâmbulo]
Task: closing sweep. (1) Run and fix to zero: english-only and boundary-check over the
WHOLE repo (including README files and commit-adjacent docs); delete docs/_port-input/.
(2) Generate factory/docs/INVENTORY.md — one line per factory artifact (path, purpose,
origin decision), the new repo's own baseline photo; tag the repo state as
factory-core-v0 (annotated tag). (3) Verify §2.7 structure completeness: report any file
in the port map (§2.1–2.6) missing or any extra file not in the map. (4) Write the final
session report: port-map coverage table (every source row → done/skipped+why), label
reconciliation result, open findings parked during S1–S5. Do not fix parked findings —
report only.
Validation: both gates exit 0 repo-wide; npm test green; INVENTORY.md complete; report
ready for the Fable review session.
```
**Critério:** relatório final pronto → dispara a sessão C (Fable) do GUIA-DE-SESSOES.

## 4. Gate de conclusão do EVP1 (o que a sessão C confere)

Tudo determinístico e re-rodável; a sessão C (Fable, prompt pronto no GUIA) dá o veredito.

| # | Verificação | Como (comando) | Passa se |
|---|---|---|---|
| 1 | **Core 100% EN** | `node .github/scripts/english-only.mjs` (mesmo job do CI; camada A = letra não-ASCII, camada B = stopwords PT); conferência manual: `grep -rInE "[ãõáéíóúâêôç]" CLAUDE.md DECISIONS.md .claude .github factory --include="*"` | exit 0 / nenhuma linha fora da allowlist de nomes citados; as 2 camadas provadas por violação plantada (S1.1) |
| 2 | **Fronteira de pastas** | `node .github/scripts/boundary-check.mjs` + inspeção: `factory/`, `.claude/`, `.github/` sem referência a produto; `project/` e `app/` vazios (só README/.gitkeep) | exit 0; regra de ouro escrita no CLAUDE.md e nos READMEs |
| 3 | **Harness verde "vazio"** | `npm test` local e job `factory-tests` no CI da main | suite completa verde com `app/` vazio |
| 4 | **Violações plantadas mordem** | fixtures de `factory/bench/tests/design/fixtures/` — testes que ESPERAM falha dos gates | testes de fixture violada passam (gate reprova) |
| 5 | **Guard-rails íntegros** | diff conceitual vs repo antigo: D-019 (saída), D-034 (publicação não-IA), D-037 (fail-closed), D-047 (re-entrada c/ teto), D-087 (teto de rodadas), D-033/D-042 (integridade do juiz), D-039 (fork), D-032 (credencial) presentes nos workflows novos | 8/8 localizáveis e com a mesma lógica |
| 6 | **DP-5 resolvido** | D-002 no DECISIONS.md; nenhum papel com duas fontes executáveis (grep dos role-card headers × prompts inline) | fonte única por papel |
| 7 | **F1 no builder** | cláusula no `developer-lead.md` + prompt do `implement.yml`; cenário C5 atualizado | presente nos 3 lugares |
| 8 | **F2 nos vereditos** | step de retry em review/security/verdict/design-critic | 4/4, fail-closed preservado |
| 9 | **Workflows válidos** | `actionlint` sobre `.github/workflows/` | 0 erros |
| 10 | **Estrutura e governança** | árvore §2.7 completa; branch protection ativa com os 3 required checks; repo marcado template; tag `factory-core-v0` | tudo presente |

Veredito SIM → atualizar `claude/STATE.md` (EVP1 concluído, próximo = EVP2) num chat
Cowork. Veredito NÃO → pendências com severidade voltam como prompts de correção (mesmo
formato §3) antes de reauditar.

## 5. Riscos específicos do EVP1 (além dos do plano vigente §9)

- **Tradução que muda comportamento** (regex, filtro `jq`, string de label): mitigado por
  "logic byte-for-byte" nos prompts + os testes portados que executam os scripts reais
  (reentry, design-md, pretooluse) — mudou a lógica, o teste acusa.
- **CI "vazio" mentindo verde** (jobs de produto pulados para sempre): a condição "app has
  code" é determinística e documentada no `ci.yml`; o EVP3 a exercita de verdade.
- **Sessão Sonnet decidindo contrato por conveniência:** as decisões já estão na §0; o
  preâmbulo manda parar e reportar. Achado fora de escopo → relatório, nunca diff.
- **FACTORY-FLOW não disponível na sessão S2:** resolvido pelo passo manual do dono
  (`docs/_port-input/`), apagado na S6.

## Como continuar (handoff)

1. **Dono:** bootstrap §1 (criar repo, labels, permissões; branch protection após S1).
2. **Sessões Sonnet S1→S6** no VSCode, nesta ordem, um chat por sessão, prompt colado.
3. **Sessão C (Fable)** com o prompt pronto do GUIA-DE-SESSOES + a tabela §4 deste plano.
4. Veredito SIM → atualizar `claude/STATE.md` e abrir a Sessão de planejamento do EVP2.