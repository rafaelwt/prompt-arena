# Prompt Arena

Same prompt, different models and harnesses. Each **challenge** is one prompt; each **run** is one model's attempt at it, published untouched so the results can be compared side by side.

Plain HTML, CSS and vanilla JS. No framework, no build step.

## Structure

```
index.html                  Home: list of challenges
view.html                   Run viewer: back bar + iframe with the untouched output
assets/
  styles.css                Shared styles (responsive, light/dark)
  app.js                    Renders pages from the JSON files
challenges/
  index.json                List of challenges
  <challenge>/
    index.html              Challenge page (prompt + run cards)
    prompt.md               The exact prompt given to every model
    runs.json               Metadata of every run
    runs/<run>/             Model output, exactly as delivered
docs/
  metadata-prompt.md        Prompt to collect run metadata from each agent
netlify.toml
```

Folders are the routes: `/challenges/gummy-bears/` is a real directory with its own `index.html`.

## Run locally

`fetch` does not work over `file://`, so serve the folder:

```sh
python -m http.server 8000
```

Then open http://localhost:8000.

## Add a run

1. Wait until the agent has finished. Do not move a folder while an agent is still working in it.
2. Move its output to `challenges/<challenge>/runs/<run-slug>/` with `git mv`. Never edit the output files.
3. Ask the agent for its metadata with [docs/metadata-prompt.md](docs/metadata-prompt.md), and verify it against the harness logs.
4. Add or update its entry in `challenges/<challenge>/runs.json`:

```json
{
  "slug": "opus-5-5",
  "model": "Opus 5.5",
  "provider": "Anthropic",
  "harness": "Claude Code 2.1.299",
  "effort": "medium",
  "duration": "21m 06s",
  "tokens_in": null,
  "tokens_out": null,
  "turns": null,
  "entry": "gummy-bears.html",
  "status": "done",
  "notes": "Known issues, in one line."
}
```

`status` is `done`, `dnf` or `pending`. `dnf` (did not finish) runs can be opened, so a snapshot of an agent that never finished stays viewable; copy its file instead of moving it while the agent is still running. Pending runs show as "In progress" and cannot be opened. `tokens_in`, `tokens_out`, `cost_usd`, `turns`, `nudges` and `notes` are optional.

- `tokens_in`: fresh input tokens, excluding cache reads.
- `cost_usd`: API-equivalent cost of the run. pi logs it per message; for Claude Code, compute it from the logged usage and the API price list (Claude Code writes cache with the 1-hour TTL).
- `nudges`: how many times a human had to step in during the run ("continue", tool hints, bug reports).

## Add a challenge

1. Create `challenges/<slug>/` with `prompt.md`, `runs.json` and an `index.html` copied from an existing challenge (update `data-challenge`, the title and the subtitle).
2. Add the challenge to `challenges/index.json`.

## Deploy

Netlify serves the repo root as-is (`netlify.toml` sets `publish = "."`). Connect the Git repository and every push deploys.
