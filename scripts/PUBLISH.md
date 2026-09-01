# Publicar da VPS / Cursor (`npm run publish`)

Envia commits desta máquina para GitHub e dispara o **Deploy Top1Tags** (Actions).

## 1. Configurar token (uma vez)

No GitHub: **Settings → Developer settings → Fine-grained token** (ou classic PAT):

- Repositório: `unknoww77/tags`
- Permissões: **Contents** (Read/Write), **Actions** (Read/Write) — necessário para `--cancel`

Adicione no `.env` (nunca commitar):

```env
GIT_PUSH_TOKEN=ghp_xxxxxxxx
GITHUB_REPO=unknoww77/tags
```

## 2. Comandos

```bash
# Commit + push (espera deploy anterior terminar)
npm run publish -- -m "feat: minha alteração"

# Cancela deploy em andamento e sobe tudo junto no próximo
npm run publish -- --cancel -m "feat: pacote de correções"

# Só commit local se deploy rodando; push manual depois
npm run publish -- --batch -m "WIP: salvar local"

# Ver git + status do deploy
npm run publish -- --status
```

## 3. Fila de deploy (GitHub)

O workflow `.github/workflows/deploy.yaml` já usa:

```yaml
concurrency:
  group: deploy-top1tags
  cancel-in-progress: false
```

Ou seja: **vários pushes** entram em fila no GitHub; cada um espera o anterior **terminar** (não cancela deploy no meio).

| Modo local | Comportamento |
|------------|----------------|
| `--wait` (padrão) | Espera deploy GH terminar **antes** do `git push` |
| `--cancel` | Cancela run(s) ativos via API, depois faz **um** push |
| `--batch` | Commit local; **não** push se deploy rodando |

## 4. Lock local

Scripts concorrentes usam `.publish-queue/.lock` — dois `publish` ao mesmo tempo não correm em paralelo.

## 5. Primeiro push pendente

Se já existe commit local sem push:

```bash
npm run publish -- -m "feat: WhatsApp multi-número com distribuição por %"
```

(ou `git push` manual com o token configurado)
