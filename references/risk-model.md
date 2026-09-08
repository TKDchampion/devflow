# Risk and routing model

Use judgment, not a mechanical point total. Classify the highest applicable level.

## LOW

Use LOW only when requirements are clear, the change follows an established pattern, rollback is easy, and there is no meaningful implementation choice. Typical examples are copy, styling, a small field addition, a narrow bug fix, or routine CRUD contained to one area.

## MEDIUM

Use MEDIUM when a change crosses layers, affects state or API behavior, touches several related files, adds a dependency, changes a public interface, or has two or more credible implementation approaches.

## HIGH

Use HIGH for any hard trigger or when uncertainty compounds across multiple dimensions.

Hard triggers include:

- Authentication, authorization, permissions, secrets, or sensitive data
- Payments, billing, financial calculations, or irreversible external actions
- Database migrations, destructive operations, or difficult rollback
- Security boundaries, cryptography, sandboxing, or untrusted input execution
- Cross-service protocols, distributed coordination, queues, or concurrency correctness
- Public API compatibility, large refactors, or architecture changes
- Performance-critical paths or changes with a large blast radius
- Materially ambiguous requirements whose answers change the architecture

## Meaningful implementation decision

A decision is meaningful when credible approaches differ in architecture, data model, state management, API shape, dependencies, performance, security, maintainability, rollout, or reversibility. Do not manufacture alternatives for trivial edits.

## Escalation rules

Escalate at any time when new evidence raises risk or invalidates the selected solution. Never silently switch architecture. Return to the tradeoff gate and obtain a new explicit user decision.
