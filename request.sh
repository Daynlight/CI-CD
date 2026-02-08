#!/usr/bin/env bash

METHOD="GET"
PRIVATE_KEY="private.pem"
URL="https://127.0.0.1:3000/api/service/"

USERNAME="Daynlight"
REPO="Big-data-server"

# unix timestamp
TIMESTAMP=$(date +%s)

# no body for GET
BODY_HASH="-"

# canonical string
CANONICAL="${METHOD}\n${TIMESTAMP}\n${BODY_HASH}"

# sign it
SIGNATURE=$(printf "$CANONICAL" \
  | openssl dgst -sha256 -sign "$PRIVATE_KEY" \
  | base64 -w 0)

# send request
curl -v -k \
  -H "X-Username: $USERNAME" \
  -H "X-Repo: $REPO" \
  -H "X-Body: $TIMESTAMP" \
  -H "X-Sig-body: $SIGNATURE" \
  "$URL"
