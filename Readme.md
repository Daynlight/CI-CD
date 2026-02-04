# CI/CD Base Architecture

## Overview

This system implements a secure, rate-limited, multi-stage CI/CD deployment pipeline.
The goal is to safely deploy services from GitHub while preventing duplicate, malicious,
or excessive deployment requests.

The architecture is designed to be extensible (multi-server, geo-aware) but starts with
a simple, reliable core.

---

## High-Level Flow

1. Developer pushes code to repository
2. GitHub Actions triggers on push
3. GitHub Actions sends a signed POST request
4. Central Control Server validates and queues request
5. Request is forwarded to the target Service Server
6. Service Server builds, tests, and atomically deploys

---

## Components

### 1. GitHub Actions (CI Trigger)

Responsibilities:
- Trigger on push / merge
- Generate deployment payload
- Sign request using secret
- Send POST request to Control Server

Payload includes:
- repository
- branch
- commit hash
- timestamp
- signature

---

### 2. Control Server (Deployment Gateway)

Purpose:
Acts as a protected entry point between CI and service servers.

Responsibilities:
- Verify request signature
- Enforce TLS
- Rate limiting (per repo / service)
- Cooldown enforcement
- Deduplicate requests
- Queue valid requests
- Forward signed request to Service Server

State tracking:
- Last deployed commit hash
- Active deployment flags
- Cooldown timestamps

If:
- request already exists → ignore
- commit hash unchanged → skip
- cooldown active → queue or drop

---

### 3. Service Server (Deployment Executor)

Purpose:
Safely deploy the application.

Responsibilities:
- Verify forwarded signature
- Enforce local cooldown
- Check last deployed commit
- Clone / pull repository
- Create temporary deployment environment
- Run tests and health checks
- Atomically swap deployments
- Shutdown previous version

Deployment strategy:
- Temporary instance
- Validate
- Swap traffic
- Cleanup old instance

---

## Security Model

- All communication over TLS
- Requests signed using shared secret or asymmetric key
- Signature verified at every hop
- No public exposure of Service Server endpoints
- Control Server address not publicly discoverable

---

## Rate Limiting & Cooldowns

Implemented at two levels:
1. Control Server (global protection)
2. Service Server (local protection)

Mechanisms:
- Max requests per minute/hour
- Cooldown after successful deployment
- Deduplication via commit hash comparison

---

## Scalability & Future Extensions

Planned extensions (not required for v1):
- Multiple Control Servers
- Geo-aware routing to nearest Service Server
- Internal caching for deployment metadata
- Layered forwarding (multi-hop control plane)

---

## Non-Goals (v1)

- CDN caching of deployment requests
- Multi-region synchronization
- Auto-scaling deployment runners

---

## Summary

This architecture prioritizes:
- Safety
- Idempotency
- Controlled rollout
- Clear separation of responsibilities

The system is intentionally simple at its core,
with room to scale without redesign.
