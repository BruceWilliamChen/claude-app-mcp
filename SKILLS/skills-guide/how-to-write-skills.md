# How to Write Skills

---

```
name: How to Write Skills
description: A guide for creating and organizing skill documents in the SKILLS directory. Covers directory structure, file format, and conventions.
```

---

## Directory Structure

Skills are organized by topic in subdirectories under `SKILLS/`:

```
SKILLS/
├── how-to-write-skills.md    ← this file (top-level, meta)
├── project-setup/            ← topic folder
│   └── scaffold-mcp-app.md  ← individual skill
├── mcp-server/
│   └── register-tools.md
├── react-ui/
│   └── ext-apps-wiring.md
└── ...
```

- **One folder per topic area** — group related skills together (e.g. `project-setup/`, `mcp-server/`, `react-ui/`).
- **One file per skill** — each `.md` file covers one discrete, reusable piece of knowledge.
- Use kebab-case for folder and file names (e.g. `project-setup/scaffold-mcp-app.md`).

### When to create a new folder

Create a new topic folder when you're entering a distinct area of the project (e.g. server setup vs. UI components vs. build/deploy).

### When to create a new skill file

Create a new skill file when the knowledge is self-contained and could be referenced independently. If two things are tightly coupled, they can share a file.

---

## Skill Document Format

Every skill file follows this structure:

### 1. Title

A markdown H1 heading with the skill name.

```markdown
# Scaffold an MCP App Project
```

### 2. Separator

A horizontal rule to visually separate the header from metadata.

```markdown
---
```

### 3. Metadata Block

A fenced code block containing `name` and `description` as plain key-value pairs.

````markdown
```
name: Scaffold an MCP App Project
description: How to set up the directory structure, configuration files, and dependencies for an MCP app.
```
````

- **name** — short, imperative phrase describing the skill.
- **description** — one or two sentences summarizing what the skill covers and when to use it.

### 4. Separator

Another horizontal rule before the body content.

```markdown
---
```

### 5. Body

The rest of the document is free-form markdown. Use whatever structure makes sense for the skill. Common sections include:

- **Steps / How-to** — ordered instructions
- **Code examples** — with language-tagged fenced blocks
- **Tables** — for comparing options or listing dependencies
- **Explanations** — the "why" behind decisions
- **Gotchas** — common pitfalls and how to avoid them

---

## Template

````markdown
# Skill Name Here

---

```
name: Skill Name Here
description: One or two sentences about what this skill covers.
```

---

## Section 1

Content...

## Section 2

Content...

## Gotchas

- Gotcha 1
- Gotcha 2
````

---

## Keeping Skills Up to Date

Skills are living documents. As you work through a step, **actively update the corresponding skill file** with anything you discover:

- **Gotchas** — if something fails unexpectedly, add it to the Gotchas section of the skill that covers that area. Don't create a new file; append to the existing one.
- **Code corrections** — if a code example in the skill turns out to be wrong (e.g. a Vite config that doesn't actually work), fix it in place so the skill always reflects what actually works.
- **New context** — if you learn something important during implementation (e.g. "placeholder files are needed to verify the build"), add it where it's most relevant.

The goal: if someone reads the skill doc *before* doing the work, they should not hit the same surprises you hit.

---

## Conventions

- Write in a direct, practical tone — these are reference docs, not tutorials.
- Include the "why" alongside the "what" — explain decisions, not just steps.
- Keep code examples copy-pasteable when possible.
- Update skills when you learn something new — they're living documents.
- Don't duplicate info across skills — link to other skill files instead.
