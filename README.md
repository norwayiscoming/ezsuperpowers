# ezsuperpowers

**Plain language mode for Claude Code — for non-developers.**

When you brainstorm with Claude, the answers are usually full of technical terms. ezsuperpowers fixes that: every response gets a plain-language section first, written in cause-and-effect product language — no jargon, no analogies, just what actually happens on screen for your users.

---

## What it does

After installing, every Claude response to a technical question automatically has two parts:

**[In Plain Terms]** — The main section. Written for non-developers. Explains what changes for the user, what they see, what happens next. Uses product language: buttons, screens, errors, speed, cost. Never jargon.

> **[tech]** — One compact line for Claude's internal planning. You don't need to read this.

---

## Who it's for

Non-developers who use Claude Code to brainstorm products, features, or decisions — and want answers they can actually understand and act on.

---

## Requirements

- [Claude Code](https://claude.ai/code) installed and running

---

## Installation

Install this extension in VS Code. That's it.

Claude Code will automatically switch to plain language mode the next time you start a session.

---

## How to verify it's working

Start a Claude Code session and ask any technical question. The response will begin with **[In Plain Terms]** in plain cause-and-effect language.

Or run the slash command:

```
/ezsuperpowers:brainstorm
```

---

## Uninstalling

Uninstall the VS Code extension. Claude Code will return to its default behavior on the next session restart.
