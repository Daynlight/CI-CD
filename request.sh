#!/usr/bin/env bash

PRIVATE_KEY="private.pem"
URL="http://127.0.0.1:3000/api/service/Daynlight/Big-data-server"
METHOD="GET"

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
curl -v \
  -H "X-Timestamp: $TIMESTAMP" \
  -H "X-Signature: $SIGNATURE" \
  "$URL"
