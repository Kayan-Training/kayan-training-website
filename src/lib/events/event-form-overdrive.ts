import type { EventFormSectionId } from "./event-form-visibility";

export type OverdriveStep = {
  detail: string;
  id: string;
  priority: 1 | 2 | 3;
  sectionId: EventFormSectionId;
  title: string;
};

export type OverdrivePlan = {
  confidence: number;
  summary: string;
  steps: OverdriveStep[];
};

export function buildOverdrivePlan(input: {
  activeSection: EventFormSectionId;
  blockingErrors: number;
  hasPublishedStatus: boolean;
  registrationsCount: number;
}) {
  const { activeSection, blockingErrors, hasPublishedStatus, registrationsCount } =
    input;

  const steps: OverdriveStep[] = [];

  if (blockingErrors > 0) {
    steps.push({
      detail:
        "Resolve blocking validation issues first. Publishing and learner flow quality depend on this.",
      id: "clear-blocking-errors",
      priority: 1,
      sectionId: activeSection,
      title: "Clear blocking errors",
    });
  }

  if (!hasPublishedStatus) {
    steps.push({
      detail:
        "Review visibility status after core sections are complete, then switch from draft to published.",
      id: "prepare-publishing-state",
      priority: 2,
      sectionId: "identity",
      title: "Prepare publishing state",
    });
  }

  if (registrationsCount > 0) {
    steps.push({
      detail:
        "Validate registration status labels, entries, and operational readiness before announcing updates.",
      id: "review-live-operations",
      priority: 2,
      sectionId: "registrations",
      title: "Review live operations",
    });
  } else {
    steps.push({
      detail:
        "Simulate first-time learner flow: pricing, registration state, and confirmation path.",
      id: "run-learner-flow-check",
      priority: 3,
      sectionId: "pricing",
      title: "Run learner flow sanity check",
    });
  }

  const confidence = Math.max(
    55,
    Math.min(
      98,
      92 - blockingErrors * 6 + (hasPublishedStatus ? 4 : -6) + (registrationsCount > 0 ? 2 : 0),
    ),
  );

  return {
    confidence,
    steps: steps.sort((a, b) => a.priority - b.priority),
    summary:
      blockingErrors > 0
        ? "Execution is blocked by validation issues. Prioritize structural fixes."
        : "Form is structurally healthy. Focus on publish and operations quality.",
  } satisfies OverdrivePlan;
}
