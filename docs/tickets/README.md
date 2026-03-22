# Ticket System

Track what we do, why, and how. Each ticket is a markdown file.

## Ticket Format

```
TICKET-NNN-short-description.md
```

## Template

```markdown
# TICKET-NNN: Title

**Status:** Open | In Progress | Done | Blocked
**Created:** YYYY-MM-DD
**Priority:** Critical | High | Medium | Low
**Assignee:** Name

## What
What needs to be done. Be specific.

## Why
Why this matters. What problem does it solve? What breaks without it?

## How
Technical approach. Key decisions, files affected, trade-offs.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Bug Details (if applicable)
- **Observed:** What happened
- **Expected:** What should have happened
- **Reproduce:** Steps to reproduce

## Progress Log
_Date — what was done_
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Open** | Not started |
| **In Progress** | Someone is working on it |
| **Blocked** | Can't proceed — state why |
| **Done** | Completed and verified |

## Conventions

- One ticket per issue/task
- Reference related tickets: "See TICKET-002"
- Update the progress log as work happens
- Move to Done only when acceptance criteria are all checked
