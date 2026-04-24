# Security Policy

Zeus is a local-first CLI agent. Because users can install and run custom tools, security issues are taken seriously.

## Supported Versions

Zeus is pre-1.0. Security fixes target the latest `main` branch until the first stable release.

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories once the repository is published.

If advisories are not available yet, contact the maintainer privately before opening a public issue.

Useful report details:

- Affected command, skill, or tool behavior
- Steps to reproduce
- Expected impact
- Whether local files, shell execution, network access, or credentials are involved

## Security Model

- Tool manifests are validated before install.
- Tool permissions are explicit: `readonly`, `sandbox`, or `elevated`.
- Shell input interpolation is quoted before execution.
- Secrets should be provided through environment variables and never committed.

## Out of Scope

- Misconfigured third-party APIs
- Unsafe tools installed from untrusted sources
- Prompt-injection outcomes that do not cross a local security boundary
