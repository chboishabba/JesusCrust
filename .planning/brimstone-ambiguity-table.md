# Brimstone Ambiguity Table

| Ambiguity | Owner | Justification | Escalation trigger for deeper integration |
| --- | --- | --- | --- |
| Operational boundary between Brimstone lane services and JesusCrust shared platform (which side owns request validation/resilience) | Brimstone | Brimstone is designing the lane interface and can assert the request expectations upfront, reducing JC work | Trigger when requests require JC-wide telemetry or orchestrated retries—not resolved within lane specs |
| Data schema extensions needed for upcoming Brimstone features | JC | JC maintains the master schema and ensures compatibility across bundles; Brimstone may request changes | Trigger when Brimstone demands schema breaks or version bumps that ripple across JC crates |
| Runtime configuration defaults (logging levels, feature flags) for lane components | Brimstone | Lane team knows the operational profile and can set conservative defaults while JC provides the hooks | Trigger when defaults conflict with JC-wide observability requirements or security policies |
| Error-reporting semantics (e.g., retry vs abort) inside lane workflows | Brimstone | The lane implements its own orchestration and can author local policies consistently | Trigger when Brimstone behavior needs cross-lane coordination or JC needs centralized incident handling |
| Release cadences and deployment windows for Brimstone-specific artifacts | Brimstone | Brimstone controls the delivery schedule of its assets; JC aligns broader platform releases | Trigger when lane delivery must synchronize with JC platform upgrades or customers need coordinated rollout |

Escalation note: whenever Brimstone requirements reach beyond lane-specific concerns—touching shared schema, platform stability, or customer-facing contracts—JC should be pulled into a joint working session and the ticket flagged for cross-team review.
