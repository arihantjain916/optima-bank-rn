# Send Money screen design QA

- Source visual truth: user-provided mobile screenshot in this conversation (no local file path available).
- Implementation screenshot: unavailable; this session has no mobile preview or capture tool.
- Viewport/state: intended portrait Send tab, initial entry state.
- Full-view comparison evidence: blocked because the rendered implementation cannot be captured.
- Focused region comparison evidence: blocked for the same reason.

## Findings

- [P1] Visual fidelity cannot be verified from a rendered screen.
  - Location: `app/(tabs)/send.tsx`.
  - Evidence: the supplied screenshot is available, but no local app screenshot can be captured in this session.
  - Impact: spacing, typography, keypad proportions, and modal behavior cannot be verified against the visual target.
  - Fix: run the Expo app on a mobile simulator/device, capture the Send tab at the reference viewport, then compare it to the source screenshot.

## Open Questions

- The real transfer-submission API route and payload are not present in the workspace, so the confirmation flow intentionally reviews details without claiming to initiate a money movement.

## Implementation Checklist

1. Capture the Send tab in a portrait mobile viewport.
2. Compare the initial, validation-error, and review-sheet states against the reference.
3. Wire the review confirmation to the backend once the transfer endpoint contract is available.

## Follow-up Polish

- Validate exact font sizing and vertical spacing against a device screenshot.

## Patches made

- Replaced the Send placeholder with a functional recipient, amount keypad, validation, balance-loading, and review-sheet flow.

## Final result

blocked
