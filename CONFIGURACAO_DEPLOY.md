# Configuração do deploy pela primeira vez

Este guia explica, passo a passo, como criar o repositório, configurar o Git, preparar a chave SSH da VPS e cadastrar os secrets no GitHub.

## 1. Criar o repositório no GitHub

1. Entre no GitHub e clique em **New repository**.
2. Escolha o nome do repositório.
3. Não marque as opções para criar README, `.gitignore` ou licença, pois o projeto já possui esses arquivos.
4. Clique em **Create repository**.

## 2. Inicializar o Git no projeto

Abra o terminal dentro da pasta do projeto e execute:

```bash
git init
git add .
git commit -m "chore: initial project setup"
git branch -M main
```

## 3. Conectar o projeto ao GitHub

No GitHub, abra o repositório, clique em **Code** e copie a URL SSH. Ela será parecida com:

```text
git@github.com:seu-usuario/nome-do-repositorio.git
```

No terminal, execute:

```bash
git remote add origin git@github.com:seu-usuario/nome-do-repositorio.git
```

Confira se o remote foi adicionado:

```bash
git remote -v
```

Envie o projeto:

```bash
git push -u origin main
```

> O comando correto é `git remote add origin`. Não é `git add remote origin`.

## 4. Configurar o acesso SSH à VPS

A pipeline do GitHub precisa de uma chave SSH para entrar na VPS. A chave possui duas partes:

- **Chave privada:** será colocada no secret `INFRA_SERVER_KEY`.
- **Chave pública:** será adicionada ao arquivo `authorized_keys` da VPS.

> Nunca publique, versione ou envie a chave privada para outras pessoas.

### 4.1. Entrar na VPS

```bash
ssh root@IP_DA_VPS -p 20203
```

Substitua `IP_DA_VPS` pelo IP público da VPS. Se a hospedagem fornecer outro usuário, substitua `root` pelo usuário informado.

### 4.2. Gerar a chave SSH

Dentro da VPS, execute:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

Quando aparecer `Enter passphrase`, pressione `Enter`. Quando pedir novamente, pressione `Enter` outra vez.

Serão criados dois arquivos:

```text
~/.ssh/github_actions_deploy
~/.ssh/github_actions_deploy.pub
```

- `github_actions_deploy` é a chave privada.
- `github_actions_deploy.pub` é a chave pública.

### 4.3. Ver a chave pública

```bash
cat ~/.ssh/github_actions_deploy.pub
```

O conteúdo será parecido com:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-actions-deploy
```

### 4.4. Adicionar a chave pública ao `authorized_keys` com Vim

Abra o arquivo:

```bash
vim ~/.ssh/authorized_keys
```

Dentro do Vim:

1. Pressione `i` para entrar no modo de edição.
2. Vá até o final do arquivo.
3. Cole a chave pública em uma nova linha.
4. Pressione `Esc`.
5. Digite `:wq`.
6. Pressione `Enter`.

Configure a permissão correta:

```bash
chmod 600 ~/.ssh/authorized_keys
```

> O nome correto é `authorized_keys`, e não `authorized_hosts`.

### 4.5. Alternativa sem usar Vim

Você também pode adicionar a chave pública automaticamente:

```bash
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 4.6. Copiar a chave privada

Mostre a chave privada:

```bash
cat ~/.ssh/github_actions_deploy
```

Copie o conteúdo completo, incluindo estas linhas:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Essa chave privada será colocada no secret `INFRA_SERVER_KEY`.

> Não use o arquivo terminado em `.pub` no `INFRA_SERVER_KEY`.

## 5. Testar a chave SSH

Ainda dentro da VPS, execute:

```bash
ssh -i ~/.ssh/github_actions_deploy root@127.0.0.1 -p 20203
```

Se a VPS utilizar outro usuário:

```bash
ssh -i ~/.ssh/github_actions_deploy USUARIO@127.0.0.1 -p 20203
```

Na primeira execução poderá aparecer:

```text
Are you sure you want to continue connecting?
```

Digite:

```text
yes
```

A conexão deve acontecer sem solicitar senha. Para sair, execute:

```bash
exit
```

## 6. Adicionar os secrets no GitHub

No repositório, acesse:

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

### Secrets obrigatórios

#### `INFRA_SERVER_IP`

Informe o IP público da VPS, disponível no painel da hospedagem.

```text
203.0.113.10
```

#### `INFRA_SERVER_USERNAME`

Informe o usuário SSH da VPS. Normalmente é:

```text
root
```

Se a hospedagem fornecer outro usuário, utilize o usuário informado por ela.

#### `INFRA_SERVER_KEY`

Cole a chave SSH **privada** completa:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### `INFRA_ENV`

Cole todo o conteúdo do arquivo `.env` de produção (baseie-se em `.env.example`).

Exemplo mínimo Top1Tags:

```dotenv
APP_DOMAIN=top1tags.dev
APP_URL=https://top1tags.dev
PLATFORM_DOMAIN=top1tags.dev
DATABASE_URL=postgresql://top1tags:SENHA_FORTE@postgres:5432/top1tags?schema=public
POSTGRES_USER=top1tags
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=top1tags
AUTH_SECRET=gere-com-openssl-rand-base64-32
SUPER_ADMIN_EMAIL=admin@top1tags.dev
SUPER_ADMIN_PASSWORD=troque-esta-senha
SUPER_ADMIN_NAME=Super Admin
CLOUDFLARE_API_TOKEN=seu-token
CLOUDFLARE_ACCOUNT_ID=seu-account-id
CRON_SECRET=gere-outro-segredo
TRACKING_IP_SALT=gere-outro-salt
```

DNS: na zona `top1tags.dev`, aponte `@`, `www` e `*` (wildcard) para o IP da VPS.

Não use `localhost` em produção.

### Secrets opcionais

A pipeline também reconhece:

| Secret | Finalidade |
| --- | --- |
| `INFRA_ALLOWED_IPS` | Restringe o acesso às portas 80 e 443 pelo UFW |
| `GOOGLE_MAPS_API_KEY` | Chave para aplicações que utilizem o Google Maps |
| `PLATFORM_TELEGRAM_BOT_TOKEN` | Token do bot responsável pelos alertas |
| `PLATFORM_TELEGRAM_CHAT_ID` | Chat ou grupo que receberá os alertas |
| `PLATFORM_HEALTH_URL` | URL pública verificada pelo monitoramento |

## 7. Executar o primeiro deploy

No GitHub, acesse:

```text
Actions
→ Deploy Top1Tags
→ Run workflow
```

Selecione a branch `main` e clique em **Run workflow**.

Os próximos deploys acontecerão automaticamente quando alterações relevantes forem enviadas para `main`.

## 8. Atualizar as variáveis de ambiente

Sempre que alguma variável de produção mudar:

1. Abra o repositório no GitHub.
2. Entre em **Settings**.
3. Acesse **Secrets and variables**.
4. Abra **Actions**.
5. Atualize o secret `INFRA_ENV`.
6. Execute novamente o workflow de deploy.

Alterar somente o `.env` no computador não atualiza a VPS.

> Nunca envie o arquivo `.env` ou uma chave privada para o GitHub. Antes de cada commit, use `git status` para conferir quais arquivos serão enviados.
