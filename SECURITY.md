# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use one of these channels:

1. **GitHub private advisory** — [Report a vulnerability](https://github.com/adrenox20/townhall/security/advisories/new) (preferred)
2. **Email** — Contact the maintainers directly (see the repository's GitHub profile for contact info)

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations

You can expect an acknowledgement within **48 hours** and a resolution timeline within **7 days** for critical issues.

## Scope

In scope:
- Authentication and session management
- Authorization / RBAC bypass
- SQL injection or data exposure via the Worker API
- Cross-site scripting (XSS) in the frontend
- Sensitive data leakage

Out of scope:
- Cloudflare infrastructure issues (report to Cloudflare directly)
- Denial of service via resource exhaustion on a self-hosted instance
- Issues in dependencies (report to the dependency maintainer)

## Disclosure Policy

We follow coordinated disclosure. Once a fix is released, we will publish a security advisory crediting the reporter (unless they prefer to remain anonymous).
