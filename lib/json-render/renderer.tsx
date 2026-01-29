"use client";

/**
 * json-render Renderer component for profile agent.
 * Renders a JSON tree using the component registry.
 */

import React from "react";
import type { JsonElement, JsonTree, ComponentName } from "./catalog";
import {
  ProposalCardComponent,
  NudgesCardComponent,
  ConfidenceGroupComponent,
  FieldUpdateCardComponent,
  AdditionalDataCardComponent,
  NoteProposalCardComponent,
  NudgeQuestionCardComponent,
  ProgressIndicatorComponent,
  AdditionalDataSectionComponent,
} from "./components";

/**
 * Component registry mapping type names to React components.
 */
const componentRegistry: Record<
  ComponentName,
  React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>
> = {
  ProposalCard: ProposalCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  NudgesCard: NudgesCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  ConfidenceGroup: ConfidenceGroupComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  FieldUpdateCard: FieldUpdateCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  AdditionalDataCard: AdditionalDataCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  NoteProposalCard: NoteProposalCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  NudgeQuestionCard: NudgeQuestionCardComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  ProgressIndicator: ProgressIndicatorComponent as React.ComponentType<{ props: Record<string, unknown>; children?: React.ReactNode }>,
  // Status components - not rendered directly, used by other components
  StatusBadge: () => null,
  ConfidenceBadge: () => null,
  SuccessCard: () => null,
  SubmittedCard: () => null,
};

/**
 * Render a single JSON element.
 */
function renderElement(element: JsonElement): React.ReactNode {
  const Component = componentRegistry[element.type];

  if (!Component) {
    console.warn(`Unknown component type: ${element.type}`);
    return null;
  }

  // Recursively render children
  const children = element.children?.map((child, index) => (
    <React.Fragment key={child.key || index}>{renderElement(child)}</React.Fragment>
  ));

  return (
    <Component key={element.key} props={element.props}>
      {children}
    </Component>
  );
}

/**
 * Props for the Renderer component.
 */
interface RendererProps {
  tree: JsonTree | null;
}

/**
 * Main Renderer component.
 * Takes a JSON tree and renders it using the component registry.
 */
export function Renderer({ tree }: RendererProps) {
  if (!tree || !tree.root) {
    return null;
  }

  return <>{renderElement(tree.root)}</>;
}

/**
 * Render a proposal tree with additional data section handling.
 */
export function ProposalRenderer({ tree }: RendererProps) {
  if (!tree || !tree.root) {
    return null;
  }

  const root = tree.root;
  if (root.type !== "ProposalCard" || !root.children) {
    return <>{renderElement(root)}</>;
  }

  // Separate children into groups
  const confidenceGroups: JsonElement[] = [];
  const additionalDataItems: JsonElement[] = [];
  let noteElement: JsonElement | null = null;

  for (const child of root.children) {
    if (child.type === "ConfidenceGroup") {
      confidenceGroups.push(child);
    } else if (child.type === "AdditionalDataCard") {
      additionalDataItems.push(child);
    } else if (child.type === "NoteProposalCard") {
      noteElement = child;
    }
  }

  // Build modified tree with proper section handling
  const Component = componentRegistry[root.type];

  return (
    <Component key={root.key} props={root.props}>
      {/* Confidence groups */}
      {confidenceGroups.map((group) => (
        <React.Fragment key={group.key}>{renderElement(group)}</React.Fragment>
      ))}

      {/* Additional data section */}
      {additionalDataItems.length > 0 && (
        <AdditionalDataSectionComponent count={additionalDataItems.length}>
          {additionalDataItems.map((item) => (
            <React.Fragment key={item.key}>{renderElement(item)}</React.Fragment>
          ))}
        </AdditionalDataSectionComponent>
      )}

      {/* Note */}
      {noteElement && renderElement(noteElement)}
    </Component>
  );
}

/**
 * Render a nudges tree.
 */
export function NudgesRenderer({ tree }: RendererProps) {
  if (!tree || !tree.root) {
    return null;
  }

  return <>{renderElement(tree.root)}</>;
}
