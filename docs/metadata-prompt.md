# Run metadata prompt

Send this to each agent once it has finished a challenge. Paste its reply into the challenge's `runs.json`.

```
Before we close: I need the metadata of this run for a comparison page.
Reply ONLY with this JSON, without extra text. Use null for anything you don't know; do not make anything up.

{
  "model": "exact model name and version",
  "provider": "provider/gateway used (e.g. OpenCode Go, Anthropic)",
  "harness": "agent/CLI used and its version (e.g. pi 0.x, Claude Code 2.x)",
  "effort": "reasoning effort (low/medium/high)",
  "started_at": "ISO timestamp of the first message",
  "finished_at": "ISO timestamp of the final delivery",
  "duration": "total time, e.g. 12m 30s",
  "tokens_in": 0,
  "tokens_out": 0,
  "cost_usd": 0,
  "turns": "number of iterations/turns",
  "entry": "main HTML file that opens the result",
  "extra_files": ["other files it generated, if any"],
  "known_issues": "what in the prompt it did NOT achieve or what is buggy, in one line"
}
```

## Verify before publishing

Agents misreport their own timing and usage. Cross-check against the harness logs before filling `runs.json`:

| Harness | Session logs |
|---|---|
| pi | `~/.pi/agent/sessions/<cwd-slug>/*.jsonl` |
| Claude Code | `~/.claude/projects/<cwd-slug>/*.jsonl` |

- **Start**: timestamp of the user message that sent the challenge prompt.
- **End**: timestamp of the last assistant message before you asked about timing.
- **Tokens, turns and cost**: sum of `usage` across assistant messages in that range.
- **Model and effort**: the `model_change` and `thinking_level_change` entries.
- Note any help you gave mid-run (for example, pointing out a tool), and when you gave it.
