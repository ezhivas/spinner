#!/bin/bash

# Test curl import endpoint

CURL_CMD='curl '"'"'{{ENV}}/kw-ums/emails/validate-content'"'"' \
  -X POST \
  -H '"'"'x-consumer-username: test1'"'"' \
  -H '"'"'Content-Type: application/json'"'"' \
  -H '"'"'Authorization: Bearer 900we9utweut034tu09u3t04'"'"' \
  -d '"'"'{\n  "kwuid": "556398",\n  "app": "UMS",\n  "tags": [\n    "tag2"\n  ],\n  "content": "aadasd asd asd asd as s href=\\"https:\n  "subject": "asdasdasd",\n  "context": "asdasd"\n}'"'"''

echo "Testing curl import..."
echo "Curl command:"
echo "$CURL_CMD"
echo ""
echo "Sending to API..."

curl -X POST http://localhost:3002/api/requests/import/curl \
  -H 'Content-Type: application/json' \
  -d "{\"curlCommand\": $(echo "$CURL_CMD" | jq -Rs .)}" | jq .
