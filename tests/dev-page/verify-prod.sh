#!/bin/bash
# Live verification of https://sam.toys/dev after a prod deploy. Never prints the password.
set -u
BASE="${BASE:-https://sam.toys}"
PW_FILE="$HOME/.config/ai-dev/secrets/sam-toys-dev-password"
J=$(mktemp); trap 'rm -f "$J"' EXIT
fail=0
say() { printf '%-58s %s\n' "$1" "$2"; }
chk() { local name="$1" got="$2" want="$3"; if [ "$got" = "$want" ]; then say "$name" "OK ($got)"; else say "$name" "FAIL (got $got, want $want)"; fail=1; fi; }

# 1. gate: anonymous GET -> 401 login page, no-store, noindex, no leak
H=$(curl -s -D - -o /tmp/dev-401.html "$BASE/dev"); code=$(printf '%s' "$H" | head -1 | awk '{print $2}')
chk "GET /dev anonymous -> 401" "$code" "401"
chk "  cache-control no-store" "$(printf '%s' "$H" | /usr/bin/grep -i -c '^cache-control: no-store')" "1"
chk "  x-robots-tag noindex" "$(printf '%s' "$H" | /usr/bin/grep -i -c '^x-robots-tag: noindex')" "1"
chk "  body is the login form" "$(/usr/bin/grep -c 'action="/dev"' /tmp/dev-401.html)" "1"
chk "  body does not contain the guide" "$(/usr/bin/grep -c 'id="factory-what"' /tmp/dev-401.html)" "0"
chk "GET /dev/ (trailing slash) -> 401" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/dev/")" "401"
chk "HEAD /dev -> 401" "$(curl -s -I -o /dev/null -w '%{http_code}' "$BASE/dev")" "401"

# 2. wrong password -> 401 with error, no cookie
H=$(curl -s -D - -o /tmp/dev-wrong.html -X POST --data-urlencode 'password=definitely-wrong' "$BASE/dev")
chk "POST wrong password -> 401" "$(printf '%s' "$H" | head -1 | awk '{print $2}')" "401"
chk "  no set-cookie on wrong password" "$(printf '%s' "$H" | /usr/bin/grep -i -c '^set-cookie:')" "0"
chk "  error message shown" "$(/usr/bin/grep -c 'Wrong password' /tmp/dev-wrong.html)" "1"

# 3. right password -> 303 + cookie (value never printed)
H=$(tr -d '\n' < "$PW_FILE" | curl -s -D - -o /dev/null -c "$J" -X POST --data-urlencode 'password@-' "$BASE/dev")
chk "POST right password -> 303" "$(printf '%s' "$H" | head -1 | awk '{print $2}')" "303"
chk "  Location: /dev" "$(printf '%s' "$H" | /usr/bin/grep -i '^location:' | tr -d '\r' | awk '{print $2}')" "/dev"
chk "  cookie attrs HttpOnly/Secure/SameSite/Path=/dev" "$(printf '%s' "$H" | /usr/bin/grep -i '^set-cookie:' | /usr/bin/grep -c 'Path=/dev; HttpOnly; Secure; SameSite=Lax')" "1"
chk "  token shape <ms>.<64hex>" "$(printf '%s' "$H" | /usr/bin/grep -i '^set-cookie:' | /usr/bin/grep -c -E 'dev_session=[0-9]{13}\.[0-9a-f]{64};')" "1"

# 4. with cookie -> 200 guide
H=$(curl -s -D - -o /tmp/dev-200.html -b "$J" "$BASE/dev")
chk "GET /dev with cookie -> 200" "$(printf '%s' "$H" | head -1 | awk '{print $2}')" "200"
chk "  guide served (27 sections)" "$(/usr/bin/grep -c '<section id=' /tmp/dev-200.html)" "27"
chk "  private no-store" "$(printf '%s' "$H" | /usr/bin/grep -i -c '^cache-control: private, no-store')" "1"
chk "  referrer-policy no-referrer" "$(printf '%s' "$H" | /usr/bin/grep -i -c '^referrer-policy: no-referrer')" "1"

# 5. logout clears
H=$(curl -s -D - -o /dev/null -b "$J" "$BASE/dev?logout=1")
chk "GET /dev?logout=1 -> 303 clears cookie" "$(printf '%s' "$H" | /usr/bin/grep -i '^set-cookie:' | /usr/bin/grep -c 'dev_session=; Max-Age=0')" "1"

# 6. nothing leaks around the gate
chk "prod /api/_lib/dev.html -> 404" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/_lib/dev.html")" "404"
chk "prod /api/dev direct -> 401 (function, not static)" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/dev")" "401"
chk "GitHub raw dev.html -> 404 (not committed)" "$(curl -s -o /dev/null -w '%{http_code}' https://raw.githubusercontent.com/fnaticsam/samfun/main/api/_lib/dev.html)" "404"
chk "PUT /dev -> 405" "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$BASE/dev")" "405"
chk "home page still 200" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")" "200"
chk "/londonplan still 401 (untouched)" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/londonplan")" "401"
rm -f /tmp/dev-401.html /tmp/dev-wrong.html /tmp/dev-200.html
[ $fail -eq 0 ] && echo "verify-prod: ALL OK" || { echo "verify-prod: FAILURES"; exit 1; }
