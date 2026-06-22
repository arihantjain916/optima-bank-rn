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

---

# Global status screens design QA

- Source visual truth: `C:\tmp\optima-error-reference.png` and `C:\tmp\optima-success-reference.png` (Stitch Error Modal State and Success & Error Modals).
- Implementation screenshot: unavailable; no browser, Android emulator, iOS simulator, or device-capture tool is available in this session.
- Viewport/state: intended portrait mobile global error boundary and `/success` route.
- Full-view comparison evidence: blocked because the rendered Expo states cannot be captured.
- Focused region comparison evidence: blocked for the same reason.

## Findings

- [P1] Rendered fidelity cannot be verified.
  - Location: `components/global-status-screen.tsx`.
  - Evidence: the two Stitch source screens are available locally, but the running app cannot be captured in this session.
  - Impact: card centering, modal width, dimmed-backdrop intensity, and action-button rhythm cannot be verified against the visual target.
  - Fix: capture the runtime error boundary and `/success` route on a portrait mobile device or simulator, then compare with the two saved source images.

## Open Questions

- The error boundary routes to onboarding when the user chooses Return Home. A future iteration could retain the last signed-in destination when the navigation state is available.

## Implementation Checklist

1. Trigger an error in a route and capture the global fallback at the target viewport.
2. Open `/success` with default and custom query parameters, then capture both primary and share actions.
3. Compare card geometry, typography, colors, and icon sizing with the Stitch references.

## Follow-up Polish

- Tune shadow and backdrop opacity after a device capture.

## Patches made

- Added a reusable global status card with Stitch-matched error and success states.
- Exported the root Expo Router error boundary with Try Again and Return Home actions.
- Added the `/success` route with configurable copy, a continue destination, and native share action.

## Final result

blocked

---

# Transaction Analytics Overview design QA

- Source visual truth: `C:\tmp\optima-transaction-analytics-reference.png` (Stitch screen: `projects/723629649857275070/screens/fec67f3f27414d8fb5eba37449312096`).
- Implementation screenshot: unavailable; no browser, Chrome, mobile simulator, or device-capture tool is available in this session.
- Viewport/state: intended portrait mobile Analytics tab, populated state, Week filter selected.
- Full-view comparison evidence: blocked because the rendered Expo route cannot be captured.
- Focused region comparison evidence: blocked for the same reason.

## Findings

- [P1] Rendered visual fidelity cannot be verified.
  - Location: `app/(tabs)/analytics.tsx`.
  - Evidence: the Stitch reference image is available locally, but no screenshot of the running Analytics tab can be captured in this session.
  - Impact: the exact chart scale, type rendering, card height, and bottom-navigation overlap cannot be verified against the reference.
  - Fix: open the Analytics tab in an Android/iOS simulator or device at a 390px-wide portrait viewport, capture it, and compare it against the saved Stitch source image.

## Open Questions

- The production transaction response may use a different date field than `date`; the current implementation preserves the existing route contract.

## Implementation Checklist

1. Capture the populated Analytics tab at the Stitch reference viewport.
2. Compare the summary cards, category section, trend chart, and recent-activity rows with the source image.
3. Tune any remaining P1/P2 spacing or typography drift from that capture.

## Follow-up Polish

- Validate the Gifted Charts donut and trend-line sizing against a captured device screenshot.

## Patches made

- Reworked `app/(tabs)/analytics.tsx` around the existing Stitch Transaction Analytics Overview: period filtering, balance and spending cards, category summary, spending trend chart, and transaction-detail navigation.
- Preserved live API loading and pull-to-refresh.
- Replaced the hand-built category and trend visualizations with `react-native-gifted-charts` PieChart and LineChart components.

## Final result

blocked
