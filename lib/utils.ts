import { seedCases } from "./seedCases";

export function getCaseById(id: string) {
  return seedCases.find((c) => c.id === id);
}

export function generateSubmissionId() {
  return `SUB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}