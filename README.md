# Zeus CLI

> Local-first AI agent for research, content, and contact workflows — powered by Ollama.

[![CI](https://github.com/MeenakshiSundaram-MS/zeus-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/MeenakshiSundaram-MS/zeus-cli/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@developed-by-ms/zeus-cli)](https://www.npmjs.com/package/@developed-by-ms/zeus-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js ≥20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

Zeus runs entirely on your machine. No cloud accounts, no API keys required to get started — just Ollama and a local model.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [Commands](#commands)
  - [zeus doctor](#zeus-doctor)
  - [zeus ask](#zeus-ask)
  - [zeus search](#zeus-search)
  - [zeus research](#zeus-research)
  - [zeus content](#zeus-content)
  - [zeus contacts](#zeus-contacts)
  - [zeus skill](#zeus-skill)
  - [zeus tool](#zeus-tool)
- [Output Formats](#output-formats)
- [Search Providers](#search-providers)
- [Extensibility](#extensibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---|---|
| **Local LLM** | Ollama-first inference — llama3.2, mistral, gemma, or any Ollama model |
| **Web search** | DuckDuckGo built-in; Brave and SerpAPI with API keys |
| **Research** | Decomposes a question into sub-queries, searches, and synthesizes a report |
| **Content generation** | SEO blog drafts and social hook posts using reusable voice profiles |
| **Contact parsing** | Filter LinkedIn CSV exports or profile URLs by role, industry, location |
| **Skills & Tools** | Install and run declarative skills and sandboxed shell tools |
| **Interactive shell** | REPL mode for conversational workflows |
| **Safe by default** | Shell inputs are quoted before interpolation; tool manifests are validated before install |

---

## Requirements

- **Node.js ≥ 20**
- **[Ollama](https://ollama.com/)** running locally (for `ask`, `research`, `content` commands)

---

## Installation

### From npm (recommended)

```bash
npm install -g @developed-by-ms/zeus-cli
zeus init
zeus doctor
```

### From source

```bash
git clone https://github.com/MeenakshiSundaram-MS/zeus-cli.git
cd zeus-cli
npm install
npm run build
npm link
zeus init
zeus doctor
```

### Development mode (no build step)

```bash
npm start -- --help
npm test
npm run verify   # typecheck + test + build
```

---

## Quickstart

```bash
# 1. Install and start Ollama
brew install ollama          # macOS; see https://ollama.com for other platforms
ollama serve
ollama pull llama3.2

# 2. Initialize Zeus
zeus init

# 3. Verify everything is working
zeus doctor

# 4. Start using Zeus
zeus ask "What is a vector database?"
zeus search "open source LLM frameworks 2024"
zeus research "best practices for RAG pipelines"
```

---

## Configuration

### zeus init

Creates the Zeus workspace at `~/.zeus/`:

```
~/.zeus/
  config.json   # main config (Ollama URL, model, search provider, format)
  skills/       # installed skill manifests
  tools/        # installed tool manifests
  voices.json   # content voice profiles
```

```bash
zeus init                  # first-time setup
zeus init --force          # reset config.json to defaults
zeus init --home /custom   # use a custom workspace directory
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Model to use for inference |
| `ZEUS_SEARCH_PROVIDER` | `auto` | Default search provider |
| `BRAVE_API_KEY` | — | Enables Brave Search |
| `SERPAPI_API_KEY` | — | Enables SerpAPI |

Set them in your shell profile or pass inline:

```bash
OLLAMA_MODEL=mistral zeus ask "Summarize transformer architecture"
```

---

## Commands

### zeus doctor

Check that Ollama, your config, and search providers are all set up correctly.

```bash
zeus doctor
```

```
Zeus environment check

  Config (~/.zeus/config.json) : OK
  Ollama                       : OK — Reachable at http://localhost:11434 (model: llama3.2)
  Search providers             : duckduckgo (built-in), brave

All checks passed. Zeus is ready.
```

---

### zeus ask

Prompt your local LLM directly.

```bash
zeus ask "Explain the CAP theorem in plain English"
zeus ask "Write a Python function to parse a CSV file" --format markdown
```

---

### zeus search

Search the web through the configured provider.

```bash
zeus search "Ollama local models comparison"
zeus search "TypeScript 5.7 new features" --provider brave --format json
```

See [Search Providers](#search-providers) for provider options.

---

### zeus research

Decomposes a question into focused sub-queries, searches each, and synthesizes a concise report with citations.

```bash
zeus research "What are the trade-offs between RAG and fine-tuning?"
zeus research "State of local AI agents in 2024" --format json
```

---

### zeus content

Generate content using reusable voice profiles.

#### Create a voice profile

```bash
zeus content voice create \
  --id dev-advocate \
  --tone "clear, technical, approachable" \
  --audience "senior software engineers" \
  --guidelines "use examples; avoid jargon; short paragraphs"
```

#### List voice profiles

```bash
zeus content voice list
```

#### Generate an SEO blog draft

```bash
zeus content blog --topic "How to run LLMs locally with Ollama" --voice dev-advocate
```

#### Generate a social hook post

```bash
# LinkedIn post (under 600 chars)
zeus content hook --platform linkedin --topic "Why local AI is the future" --voice dev-advocate

# X/Twitter post (under 280 chars)
zeus content hook --platform x --topic "Why local AI is the future" --voice dev-advocate
```

---

### zeus contacts

Parse and filter LinkedIn connections.

#### From a LinkedIn CSV export

1. Go to **LinkedIn → Me → Settings & Privacy → Data Privacy → Get a copy of your data → Connections**
2. Download and extract the CSV
3. Run:

```bash
zeus contacts find --source csv --file ~/Downloads/Connections.csv
zeus contacts find --source csv --file ~/Downloads/Connections.csv \
  --role "engineer" --industry "SaaS" --location "Bangalore" --format json
```

#### From profile URLs

```bash
zeus contacts find --source urls \
  --urls "https://linkedin.com/in/alice,https://linkedin.com/in/bob" \
  --format json
```

#### Filter options

| Flag | Description |
|---|---|
| `--role` | Substring match on job title |
| `--industry` | Substring match on industry |
| `--location` | Substring match on location |
| `--company-size` | Substring match on company size (e.g. `51-200`) |

---

### zeus skill

Manage declarative workflow skills.

```bash
zeus skill create --id my-skill --out ./skills     # scaffold a new manifest
zeus skill validate --path ./skills/my-skill.json  # validate before install
zeus skill install --path ./skills/my-skill.json   # install to ~/.zeus/skills
zeus skill list                                    # list installed skills
zeus skill remove --id my-skill                    # remove by ID
```

---

### zeus tool

Manage sandboxed shell tool integrations.

```bash
zeus tool create --id my-tool --out ./tools        # scaffold a new manifest
zeus tool validate --path ./tools/my-tool.json     # validate before install
zeus tool install --path ./tools/my-tool.json      # install to ~/.zeus/tools
zeus tool list                                     # list installed tools
zeus tool remove --id my-tool                      # remove by ID
```

---

## Output Formats

All commands support `--format`:

| Format | Description |
|---|---|
| `markdown` | Human-readable Markdown (default) |
| `json` | Machine-readable JSON — useful for scripting |
| `csv` | CSV rows — useful for spreadsheets |
| `txt` | Plain text — useful for piping |

```bash
zeus search "local AI" --format json | jq '.rows[].title'
zeus contacts find --source csv --file data.csv --format csv > filtered.csv
```

---

## Search Providers

| Provider | Requires | Quality |
|---|---|---|
| `duckduckgo` | Nothing | Good — always available |
| `brave` | `BRAVE_API_KEY` | Better — higher result quality |
| `serpapi` | `SERPAPI_API_KEY` | Best — Google-backed results |

`auto` (default) tries Brave → SerpAPI → DuckDuckGo in order.

```bash
zeus search "query" --provider auto        # try best available
zeus search "query" --provider duckduckgo  # force DuckDuckGo
zeus search "query" --provider brave       # force Brave (key required)
```

---

## Extensibility

Zeus uses a hybrid skill + tool model:

- **Skills** — declarative YAML/JSON workflows that compose prompts and tool calls
- **Tools** — executable integrations with a safety policy (readonly checks, shell quoting)

Both live locally under `~/.zeus/skills/` and `~/.zeus/tools/`.

Scaffold a new skill:
```bash
zeus skill create --id summarizer --out ./my-skills
# Edit my-skills/summarizer.json, then:
zeus skill install --path ./my-skills/summarizer.json
```

---

## Troubleshooting

**`Ollama not reachable at http://localhost:11434`**
```bash
ollama serve   # start the Ollama server
```

**`Model 'llama3.2' not found in Ollama`**
```bash
ollama pull llama3.2
```

**`Zeus is not initialized — run: zeus init`**
```bash
zeus init
```

**`zeus doctor` shows search providers only show duckduckgo**
Set `BRAVE_API_KEY` or `SERPAPI_API_KEY` for better search results.

**CSV contacts missing columns**
Zeus expects: `name, role, industry, location, company_size, profile_url`.
Use the LinkedIn **Connections** export (not the full data archive).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

1. Fork and clone
2. `npm install`
3. Make your changes
4. `npm run verify` — must pass typecheck, all 33 tests, and build
5. Open a pull request

Security issues: follow [SECURITY.md](SECURITY.md).

---

## License

[MIT](LICENSE) — Zeus Contributors
