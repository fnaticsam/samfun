#!/bin/bash
# Deterministic gate: identifiers that must never appear in the /dev page or its code.
# Usage: bash secret-scan.sh <file>...   (exit 1 on any hit)
#
# Only GENERIC patterns live here, because this file is committed to a public repo.
# Site-specific literals (real hostnames, address prefixes, account names, private
# paths) go in a file OUTSIDE the repo, one extended-regex per line, pointed to by
# SECRET_SCAN_EXTRA (default: ~/.config/ai-dev/secret-scan-extra.txt). When that file
# exists its patterns are applied too; when it does not, the scan still runs and says so.
set -u
G=/usr/bin/grep
status=0
EXTRA="${SECRET_SCAN_EXTRA:-$HOME/.config/ai-dev/secret-scan-extra.txt}"
GENERIC=(
  'id_ed25519' 'id_rsa' 'id_ecdsa' 'id_dsa' '\.ssh/' 'sudoers' 'UID [0-9]{3,}'
  '/root/' '/home/[A-Za-z0-9_-]+/' '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}'
  'sshd_config' 'jail\.d' 'after6?\.rules' 'daemon\.json' 'ignoreip' 'PermitRootLogin'
  '[A-Z_]*(API_KEY|SECRET|TOKEN|PASSWORD)=' 'sk-[A-Za-z0-9]{10,}' 'ghp_[A-Za-z0-9]{10,}'
  'github_pat_[A-Za-z0-9_]{10,}' 'xox[abp]-' 'AKIA[0-9A-Z]{12,}'
  'BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY' 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}'
)
for f in "$@"; do
  echo "== $f"
  # IPv4 addresses: anything except the loopback and wildcard addresses and version-looking strings
  hits=$($G -n -E '([0-9]{1,3}\.){3}[0-9]{1,3}' "$f" | $G -v -E '(^|[^0-9])(0\.0\.0\.0|127\.0\.0\.1)([^0-9]|$)' | $G -v -E 'v?[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[a-z]'; true)
  [ -n "$hits" ] && { echo "IPV4: $hits"; status=1; }
  # IPv6-looking addresses (four or more hex groups)
  hits=$($G -n -E '([0-9a-fA-F]{1,4}:){4,}[0-9a-fA-F]{1,4}' "$f" | $G -v -E '::1([^0-9a-f]|$)'; true)
  [ -n "$hits" ] && { echo "IPV6: $hits"; status=1; }
  for pat in "${GENERIC[@]}"; do
    h=$($G -n -E -- "$pat" "$f"; true)
    [ -n "$h" ] && { echo "HIT [$pat]: $h" | head -5; status=1; }
  done
  if [ -r "$EXTRA" ]; then
    while IFS= read -r pat; do
      [ -n "$pat" ] || continue
      case "$pat" in \#*) continue ;; esac
      h=$($G -n -E -- "$pat" "$f"; true)
      [ -n "$h" ] && { echo "HIT [site pattern]: $h" | head -5; status=1; }
    done < "$EXTRA"
  else
    echo "   (no site-specific pattern file at $EXTRA; generic patterns only)"
  fi
  # external resource loads (src=/href= to http(s) in link/script/img/iframe/media)
  ext=$($G -n -o -i -E '<(script|link|img|iframe|source|video|audio)[^>]+(src|href)="https?://[^"]+"' "$f"; true)
  [ -n "$ext" ] && { echo "EXTERNAL RESOURCE: $ext" | head -5; status=1; }
  imp=$($G -n -i -E '@import|url\(https?:' "$f"; true)
  [ -n "$imp" ] && { echo "EXTERNAL CSS: $imp" | head -5; status=1; }
done
[ $status -eq 0 ] && echo "secret-scan: CLEAN" || echo "secret-scan: FAILED"
exit $status
