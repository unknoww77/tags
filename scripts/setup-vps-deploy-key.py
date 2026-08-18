import paramiko
from pathlib import Path

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
pkey = paramiko.Ed25519Key.from_private_key_file(str(Path.home() / ".ssh" / "id_ed25519"))
client.connect(
    "111.90.148.173",
    port=20203,
    username="root",
    pkey=pkey,
    timeout=20,
    allow_agent=False,
    look_for_keys=False,
)

script = r"""
set -e
mkdir -p ~/.ssh
chmod 700 ~/.ssh

if [ ! -f ~/.ssh/github_actions_deploy ]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
  echo KEY_GENERATED
else
  echo KEY_ALREADY_EXISTS
fi

touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
PUB=$(cat ~/.ssh/github_actions_deploy.pub)
grep -qxF "$PUB" ~/.ssh/authorized_keys || echo "$PUB" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy
chmod 644 ~/.ssh/github_actions_deploy.pub

echo "--- PUBLIC KEY ---"
cat ~/.ssh/github_actions_deploy.pub
echo "--- AUTHORIZED_KEYS COUNT ---"
wc -l ~/.ssh/authorized_keys
echo "--- TEST LOCAL SSH ---"
ssh -i ~/.ssh/github_actions_deploy -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o ConnectTimeout=10 -p 20203 root@127.0.0.1 "echo DEPLOY_KEY_OK; hostname; whoami"
echo "--- PRIVATE KEY BEGIN ---"
cat ~/.ssh/github_actions_deploy
echo "--- PRIVATE KEY END ---"
"""

stdin, stdout, stderr = client.exec_command(script, timeout=60)
out = stdout.read().decode()
err = stderr.read().decode()
code = stdout.channel.recv_exit_status()
print(out)
if err:
    print("STDERR:", err)
print("EXIT", code)
client.close()
raise SystemExit(code)
