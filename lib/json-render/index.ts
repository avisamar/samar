/**
 * json-render module for profile agent.
 *
 * This module provides a declarative way to render dynamic UIs
 * for profile update proposals and follow-up questions.
 */

// Catalog and types
export * from "./catalog";

// Transform functions
export {
  transformProposalToTree,
  transformNudgesToTree,
  extractFieldIds,
  extractAdditionalDataIds,
  extractNudgeIds,
  getNudgeFieldKeyMap,
} from "./transforms";

// Components and context
export {
  ProfileAgentProvider,
  useProfileAgentContext,
} from "./components";

// Renderer
export { Renderer, ProposalRenderer, NudgesRenderer } from "./renderer";
