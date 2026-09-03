#!/bin/bash
# Deterministic gate: forbidden identifiers must not appear in the /dev page or gate.
# Usage: bash secret-scan.sh <file>...   (exit 1 on any hit)
set -u
G=/usr/bin/grep
status=0
for f in "$@"; do
  echo "== $f"
  # IPv4 addresses (any), the home IP and box IP by prefix, IPv6-looking hex groups
  hits=$($G -n -E '([0-9]{1,3}\.){3}[0-9]{1,3}' "$f" | $G -v -E '(^|[^0-9])(0\.0\.0\.0|127\.0\.0\.1)([^0-9]|$)' | $G -v -E 'v?[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[a-z]' ; true)
  [ -n "$hits" ] && { echo "IPV4: $hits"; status=1; }
  for pat in 'id_ed25519' 'id_rsa' '\.ssh/' 'sudoers' 'UID 1002' '/root/secrets' 'polygon\.env' 'sharadar\.env' '@fnatic\.com' '@driftsea\.co' 'sam@' '/home/sam' '/home/[a-z]+/' 'sshd_config' 'jail\.d' 'after\.rules' 'daemon\.json' 'ignoreip' '150\.228' '65\.109' 'BLOB_READ_WRITE_TOKEN' 'GEMINI_API_KEY' 'REFRESH_SECRET' 'CRON_SECRET' 'LONDONPLAN_PASSWORD=' 'DEV_PASSWORD=' 'sk-[A-Za-z0-9]{10,}' 'ghp_[A-Za-z0-9]{10,}' 'xox[abp]-' 'AKIA[0-9A-Z]{12,}' 'BEGIN (RSA|OPENSSH|EC) PRIVATE KEY' 'Reset root password' 'ubuntu-8gb' 'PermitRootLogin' 'api/_lib'; do
    h=$($G -n -E -- "$pat" "$f"; true)
    [ -n "$h" ] && { echo "HIT [$pat]: $h" | head -5; status=1; }
  done
  # external resource loads (src=/href= to http(s) in link/script/img/iframe/font)
  ext=$($G -n -o -i -E '<(script|link|img|iframe|source|video|audio)[^>]+(src|href)="https?://[^"]+"' "$f"; true)
  [ -n "$ext" ] && { echo "EXTERNAL RESOURCE: $ext" | head -5; status=1; }
  imp=$($G -n -i -E '@import|url\(https?:' "$f"; true)
  [ -n "$imp" ] && { echo "EXTERNAL CSS: $imp" | head -5; status=1; }
done
[ $status -eq 0 ] && echo "secret-scan: CLEAN" || echo "secret-scan: FAILED"
exit $status
