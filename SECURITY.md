# Security policy

## Supported versions

Security fixes are applied to the **latest release** on [GitHub Releases](https://github.com/mbaiges/murmur/releases). Older versions may not receive patches.

## Reporting a vulnerability

**Please do not** open a public GitHub issue for exploitable security problems.

Instead:

1. Use [GitHub Security Advisories](https://github.com/mbaiges/murmur/security/advisories/new) for this repository if you have access, **or**
2. Email the maintainer listed in [package.json](package.json) with a description, impact, and reproduction steps.

We aim to acknowledge reports within a reasonable time and will coordinate disclosure after a fix is available.

## Sensitive data in Murmur

- **Gemini API keys** are stored in local config (`murmur.config.json` under the app user data directory). They are not sent to Murmur-operated servers in v1.
- Phrase **history** is stored locally.
- RSS feeds are fetched from URLs you configure; headline text is sent to **Google Gemini** using your API key.

Do not paste API keys into issues, PRs, or screenshots.

## Dependencies

Release builds bundle dependencies declared in [package.json](package.json). Report supply-chain concerns through the same private channel above.
