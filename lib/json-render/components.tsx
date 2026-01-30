"use client";

/**
 * json-render component registry for profile agent.
 * Maps component names to React implementations.
 */

import React, { useState, createContext, useContext, useCallback } from "react";
import {
  Check,
  X,
  Pencil,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  StickyNote,
  Database,
  HelpCircle,
  Plus,
  Heart,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateContactField, isContactField } from "@/lib/validation";
import type { ComponentProps, ActionName } from "./catalog";

// =============================================================================
// Context for state management
// =============================================================================

interface FieldState {
  status: "pending" | "accepted" | "rejected";
  editedValue?: unknown;
  isEditing?: boolean;
}

interface NudgeState {
  answer: string | null;
  skipped: boolean;
}

interface InterestState {
  status: "pending" | "accepted" | "rejected";
  editedLabel?: string;
  editedDescription?: string;
  isEditing?: boolean;
}

interface ProfileAgentState {
  fieldStates: Record<string, FieldState>;
  additionalDataStates: Record<string, FieldState>;
  interestStates: Record<string, InterestState>;
  noteState: FieldState;
  nudgeStates: Record<string, NudgeState>;
  isApplying: boolean;
  isSubmitting: boolean;
  applied: boolean;
  submitted: boolean;
  error: string | null;
}

interface ProfileAgentContextValue {
  state: ProfileAgentState;
  dispatch: (action: StateAction) => void;
  onAction: (actionName: ActionName, params: Record<string, unknown>) => void;
}

type StateAction =
  | { type: "SET_FIELD_STATUS"; fieldId: string; status: "accepted" | "rejected" }
  | { type: "SET_FIELD_EDIT"; fieldId: string; value: unknown }
  | { type: "SET_FIELD_EDITING"; fieldId: string; isEditing: boolean }
  | { type: "SET_ADDITIONAL_DATA_STATUS"; dataId: string; status: "accepted" | "rejected" }
  | { type: "SET_ADDITIONAL_DATA_EDIT"; dataId: string; value: unknown }
  | { type: "SET_INTEREST_STATUS"; interestId: string; status: "accepted" | "rejected" }
  | { type: "SET_INTEREST_EDIT"; interestId: string; label?: string; description?: string }
  | { type: "SET_INTEREST_EDITING"; interestId: string; isEditing: boolean }
  | { type: "SET_NOTE_STATUS"; status: "accepted" | "rejected" }
  | { type: "SET_NOTE_EDIT"; content: string }
  | { type: "SET_NOTE_EDITING"; isEditing: boolean }
  | { type: "SET_NUDGE_ANSWER"; questionId: string; answer: string }
  | { type: "SET_NUDGE_SKIP"; questionId: string }
  | { type: "SET_APPLYING"; isApplying: boolean }
  | { type: "SET_SUBMITTED"; isSubmitting: boolean }
  | { type: "SET_APPLIED" }
  | { type: "SET_NUDGES_SUBMITTED" }
  | { type: "SET_ERROR"; error: string | null };

const ProfileAgentContext = createContext<ProfileAgentContextValue | null>(null);

export function useProfileAgentContext() {
  const context = useContext(ProfileAgentContext);
  if (!context) {
    throw new Error("useProfileAgentContext must be used within ProfileAgentProvider");
  }
  return context;
}

// =============================================================================
// Provider component
// =============================================================================

interface ProfileAgentProviderProps {
  children: React.ReactNode;
  initialFieldIds?: string[];
  initialAdditionalDataIds?: string[];
  initialInterestIds?: string[];
  initialNudgeIds?: string[];
  initialSubmitted?: boolean;
  onApply?: (data: {
    proposalId: string;
    customerId: string;
    approvedFieldIds: string[];
    approvedAdditionalDataIds: string[];
    approvedInterestIds: string[];
    approvedNote: boolean;
    editedValues: Record<string, unknown>;
    editedAdditionalData: Record<string, unknown>;
    editedInterests: Record<string, { label?: string; description?: string }>;
    editedNoteContent?: string;
  }) => Promise<void>;
  onFinalize?: (answers: Array<{ questionId: string; fieldKey: string; answer: string | null; skipped: boolean }>) => void;
}

export function ProfileAgentProvider({
  children,
  initialFieldIds = [],
  initialAdditionalDataIds = [],
  initialInterestIds = [],
  initialNudgeIds = [],
  initialSubmitted = false,
  onApply,
  onFinalize,
}: ProfileAgentProviderProps) {
  const [state, setState] = useState<ProfileAgentState>(() => ({
    fieldStates: Object.fromEntries(
      initialFieldIds.map((id) => [id, { status: "pending" as const }])
    ),
    additionalDataStates: Object.fromEntries(
      initialAdditionalDataIds.map((id) => [id, { status: "pending" as const }])
    ),
    interestStates: Object.fromEntries(
      initialInterestIds.map((id) => [id, { status: "pending" as const }])
    ),
    noteState: { status: "pending" },
    nudgeStates: Object.fromEntries(
      initialNudgeIds.map((id) => [id, { answer: null, skipped: false }])
    ),
    isApplying: false,
    isSubmitting: false,
    applied: false,
    submitted: initialSubmitted,
    error: null,
  }));

  const dispatch = useCallback((action: StateAction) => {
    setState((prev) => {
      switch (action.type) {
        case "SET_FIELD_STATUS":
          return {
            ...prev,
            fieldStates: {
              ...prev.fieldStates,
              [action.fieldId]: {
                ...prev.fieldStates[action.fieldId],
                status: action.status,
              },
            },
          };
        case "SET_FIELD_EDIT":
          return {
            ...prev,
            fieldStates: {
              ...prev.fieldStates,
              [action.fieldId]: {
                ...prev.fieldStates[action.fieldId],
                editedValue: action.value,
                status: "accepted",
                isEditing: false,
              },
            },
          };
        case "SET_FIELD_EDITING":
          return {
            ...prev,
            fieldStates: {
              ...prev.fieldStates,
              [action.fieldId]: {
                ...prev.fieldStates[action.fieldId],
                isEditing: action.isEditing,
              },
            },
          };
        case "SET_ADDITIONAL_DATA_STATUS":
          return {
            ...prev,
            additionalDataStates: {
              ...prev.additionalDataStates,
              [action.dataId]: {
                ...prev.additionalDataStates[action.dataId],
                status: action.status,
              },
            },
          };
        case "SET_ADDITIONAL_DATA_EDIT":
          return {
            ...prev,
            additionalDataStates: {
              ...prev.additionalDataStates,
              [action.dataId]: {
                ...prev.additionalDataStates[action.dataId],
                editedValue: action.value,
                status: "accepted",
              },
            },
          };
        case "SET_INTEREST_STATUS":
          return {
            ...prev,
            interestStates: {
              ...prev.interestStates,
              [action.interestId]: {
                ...prev.interestStates[action.interestId],
                status: action.status,
              },
            },
          };
        case "SET_INTEREST_EDIT":
          return {
            ...prev,
            interestStates: {
              ...prev.interestStates,
              [action.interestId]: {
                ...prev.interestStates[action.interestId],
                editedLabel: action.label ?? prev.interestStates[action.interestId]?.editedLabel,
                editedDescription:
                  action.description ?? prev.interestStates[action.interestId]?.editedDescription,
                status: "accepted",
                isEditing: false,
              },
            },
          };
        case "SET_INTEREST_EDITING":
          return {
            ...prev,
            interestStates: {
              ...prev.interestStates,
              [action.interestId]: {
                ...prev.interestStates[action.interestId],
                isEditing: action.isEditing,
              },
            },
          };
        case "SET_NOTE_STATUS":
          return {
            ...prev,
            noteState: { ...prev.noteState, status: action.status },
          };
        case "SET_NOTE_EDIT":
          return {
            ...prev,
            noteState: {
              ...prev.noteState,
              editedValue: action.content,
              status: "accepted",
              isEditing: false,
            },
          };
        case "SET_NOTE_EDITING":
          return {
            ...prev,
            noteState: { ...prev.noteState, isEditing: action.isEditing },
          };
        case "SET_NUDGE_ANSWER":
          return {
            ...prev,
            nudgeStates: {
              ...prev.nudgeStates,
              [action.questionId]: { answer: action.answer, skipped: false },
            },
          };
        case "SET_NUDGE_SKIP":
          return {
            ...prev,
            nudgeStates: {
              ...prev.nudgeStates,
              [action.questionId]: { answer: null, skipped: true },
            },
          };
        case "SET_APPLYING":
          return { ...prev, isApplying: action.isApplying };
        case "SET_SUBMITTED":
          return { ...prev, isSubmitting: action.isSubmitting };
        case "SET_APPLIED":
          return { ...prev, applied: true, isApplying: false };
        case "SET_NUDGES_SUBMITTED":
          return { ...prev, submitted: true, isSubmitting: false };
        case "SET_ERROR":
          return { ...prev, error: action.error, isApplying: false };
        default:
          return prev;
      }
    });
  }, []);

  const handleAction = useCallback(
    async (actionName: ActionName, params: Record<string, unknown>) => {
      switch (actionName) {
        case "acceptField":
          dispatch({ type: "SET_FIELD_STATUS", fieldId: params.fieldId as string, status: "accepted" });
          break;
        case "rejectField":
          dispatch({ type: "SET_FIELD_STATUS", fieldId: params.fieldId as string, status: "rejected" });
          break;
        case "editField":
          dispatch({ type: "SET_FIELD_EDIT", fieldId: params.fieldId as string, value: params.value });
          break;
        case "acceptAdditionalData":
          dispatch({ type: "SET_ADDITIONAL_DATA_STATUS", dataId: params.dataId as string, status: "accepted" });
          break;
        case "rejectAdditionalData":
          dispatch({ type: "SET_ADDITIONAL_DATA_STATUS", dataId: params.dataId as string, status: "rejected" });
          break;
        case "editAdditionalData":
          dispatch({ type: "SET_ADDITIONAL_DATA_EDIT", dataId: params.dataId as string, value: params.value });
          break;
        case "acceptInterest":
          dispatch({ type: "SET_INTEREST_STATUS", interestId: params.interestId as string, status: "accepted" });
          break;
        case "rejectInterest":
          dispatch({ type: "SET_INTEREST_STATUS", interestId: params.interestId as string, status: "rejected" });
          break;
        case "editInterest":
          dispatch({
            type: "SET_INTEREST_EDIT",
            interestId: params.interestId as string,
            label: params.label as string | undefined,
            description: params.description as string | undefined,
          });
          break;
        case "acceptNote":
          dispatch({ type: "SET_NOTE_STATUS", status: "accepted" });
          break;
        case "rejectNote":
          dispatch({ type: "SET_NOTE_STATUS", status: "rejected" });
          break;
        case "editNote":
          dispatch({ type: "SET_NOTE_EDIT", content: params.content as string });
          break;
        case "answerQuestion":
          dispatch({ type: "SET_NUDGE_ANSWER", questionId: params.questionId as string, answer: params.answer as string });
          break;
        case "skipQuestion":
          dispatch({ type: "SET_NUDGE_SKIP", questionId: params.questionId as string });
          break;
        case "applyUpdates":
          if (onApply) {
            dispatch({ type: "SET_APPLYING", isApplying: true });
            dispatch({ type: "SET_ERROR", error: null });
            try {
              const approvedFieldIds = Object.entries(state.fieldStates)
                .filter(([, s]) => s.status === "accepted")
                .map(([id]) => id);
              const approvedAdditionalDataIds = Object.entries(state.additionalDataStates)
                .filter(([, s]) => s.status === "accepted")
                .map(([id]) => id);
              const approvedInterestIds = Object.entries(state.interestStates)
                .filter(([, s]) => s.status === "accepted")
                .map(([id]) => id);
              const editedValues = Object.fromEntries(
                Object.entries(state.fieldStates)
                  .filter(([, s]) => s.editedValue !== undefined)
                  .map(([id, s]) => [id, s.editedValue])
              );
              const editedAdditionalData = Object.fromEntries(
                Object.entries(state.additionalDataStates)
                  .filter(([, s]) => s.editedValue !== undefined)
                  .map(([id, s]) => [id, s.editedValue])
              );
              const editedInterests = Object.fromEntries(
                Object.entries(state.interestStates)
                  .filter(([, s]) => s.editedLabel !== undefined || s.editedDescription !== undefined)
                  .map(([id, s]) => [id, { label: s.editedLabel, description: s.editedDescription }])
              );
              await onApply({
                proposalId: params.proposalId as string,
                customerId: params.customerId as string,
                approvedFieldIds,
                approvedAdditionalDataIds,
                approvedInterestIds,
                approvedNote: state.noteState.status === "accepted",
                editedValues,
                editedAdditionalData,
                editedInterests,
                editedNoteContent: state.noteState.editedValue as string | undefined,
              });
              dispatch({ type: "SET_APPLIED" });
            } catch (e) {
              dispatch({ type: "SET_ERROR", error: e instanceof Error ? e.message : "Failed to apply updates" });
            }
          }
          break;
        case "submitAnswers":
          if (onFinalize) {
            dispatch({ type: "SET_SUBMITTED", isSubmitting: true });
            const answers = Object.entries(state.nudgeStates).map(([questionId, s]) => ({
              questionId,
              fieldKey: "", // Will be filled by the caller
              answer: s.answer,
              skipped: s.skipped || (!s.answer && !s.skipped),
            }));
            onFinalize(answers);
            dispatch({ type: "SET_NUDGES_SUBMITTED" });
          }
          break;
      }
    },
    [dispatch, onApply, onFinalize, state]
  );

  return (
    <ProfileAgentContext.Provider value={{ state, dispatch, onAction: handleAction }}>
      {children}
    </ProfileAgentContext.Provider>
  );
}

// =============================================================================
// Component implementations
// =============================================================================

/**
 * Proposal card component - container for profile update proposals.
 */
export function ProposalCardComponent({
  props,
  children,
}: {
  props: ComponentProps<"ProposalCard">;
  children?: React.ReactNode;
}) {
  const { state, onAction } = useProfileAgentContext();

  const acceptedCount = Object.values(state.fieldStates).filter((s) => s.status === "accepted").length;
  const rejectedCount = Object.values(state.fieldStates).filter((s) => s.status === "rejected").length;
  const pendingCount = Object.values(state.fieldStates).filter((s) => s.status === "pending").length;
  const additionalAcceptedCount = Object.values(state.additionalDataStates).filter((s) => s.status === "accepted").length;
  const interestsAcceptedCount = Object.values(state.interestStates).filter((s) => s.status === "accepted").length;
  const hasAccepted =
    acceptedCount > 0 ||
    additionalAcceptedCount > 0 ||
    interestsAcceptedCount > 0 ||
    state.noteState.status === "accepted";

  if (state.applied) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="flex-shrink-0 size-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="size-4 text-green-600" />
        </div>
        <Card className="max-w-[85%] border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="size-4" />
              <span className="font-medium">Updates applied successfully</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {acceptedCount > 0 && `${acceptedCount} field${acceptedCount !== 1 ? "s" : ""} updated`}
              {acceptedCount > 0 && additionalAcceptedCount > 0 && ", "}
              {additionalAcceptedCount > 0 && `${additionalAcceptedCount} additional data item${additionalAcceptedCount !== 1 ? "s" : ""} added`}
              {(acceptedCount > 0 || additionalAcceptedCount > 0) && interestsAcceptedCount > 0 && ", "}
              {interestsAcceptedCount > 0 && `${interestsAcceptedCount} interest${interestsAcceptedCount !== 1 ? "s" : ""} confirmed`}
              {(acceptedCount > 0 || additionalAcceptedCount > 0) && state.noteState.status === "accepted" && ", "}
              {state.noteState.status === "accepted" && "note added"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <Card className="max-w-[85%] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <span className="font-medium">{props.title}</span>
            </div>
            <div className="flex gap-1">
              {acceptedCount > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20">
                  {acceptedCount} accepted
                </Badge>
              )}
              {rejectedCount > 0 && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20">
                  {rejectedCount} rejected
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </CardHeader>
        <CardContent className="space-y-4 pb-3">{children}</CardContent>
        <CardFooter className="border-t pt-3 flex justify-end">
          <Button
            size="sm"
            onClick={() => onAction("applyUpdates", { proposalId: props.proposalId, customerId: props.customerId })}
            disabled={!hasAccepted || state.isApplying}
          >
            {state.isApplying ? "Applying..." : "Apply Changes"}
          </Button>
        </CardFooter>
        {state.error && (
          <div className="px-4 pb-3">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Nudges card component - container for follow-up questions.
 */
export function NudgesCardComponent({
  props,
  children,
}: {
  props: ComponentProps<"NudgesCard">;
  children?: React.ReactNode;
}) {
  const { state, onAction } = useProfileAgentContext();

  const answeredCount = Object.values(state.nudgeStates).filter((s) => !s.skipped && s.answer).length;
  const skippedCount = Object.values(state.nudgeStates).filter((s) => s.skipped).length;
  const totalCount = Object.keys(state.nudgeStates).length;
  const remainingCount = totalCount - answeredCount - skippedCount;

  const getButtonLabel = () => {
    if (answeredCount === 0 && skippedCount === 0) return "Skip All Questions";
    if (answeredCount === totalCount) return "Submit Answers";
    if (answeredCount === 0 && skippedCount === totalCount) return "Continue Without Answers";
    if (remainingCount > 0) return `Submit, Skip ${remainingCount} Remaining`;
    return "Submit Answers";
  };

  if (state.submitted) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="flex-shrink-0 size-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="size-4 text-green-600" />
        </div>
        <Card className="max-w-[85%] overflow-hidden bg-muted/30">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">Follow-ups Submitted</span>
              <span className="text-xs text-muted-foreground">
                {answeredCount} answered, {totalCount - answeredCount} skipped
              </span>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
        <MessageSquare className="size-4 text-primary" />
      </div>
      <Card className="max-w-[85%] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium">{props.title}</span>
              <ProgressIndicatorComponent
                props={{ answered: answeredCount, skipped: skippedCount, total: totalCount }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </CardHeader>
        <CardContent className="space-y-3 pb-3 max-h-[400px] overflow-y-auto">{children}</CardContent>
        <CardFooter className="border-t pt-3 flex justify-end">
          <Button
            size="sm"
            variant={answeredCount > 0 ? "default" : "outline"}
            onClick={() => onAction("submitAnswers", { proposalId: props.proposalId })}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "Processing..." : (
              <>
                {getButtonLabel()}
                <ChevronRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Confidence group component - groups fields by confidence level.
 */
export function ConfidenceGroupComponent({
  props,
  children,
}: {
  props: ComponentProps<"ConfidenceGroup">;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(props.defaultOpen);

  const config = {
    high: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200",
    },
    medium: {
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200",
    },
    low: {
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200",
    },
  }[props.confidence];

  const Icon = config.icon;
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  // For high/medium, always show expanded
  if (props.confidence === "high" || props.confidence === "medium") {
    return (
      <div className={cn("rounded-lg border", config.borderColor)}>
        <div className={cn("flex items-center justify-between p-3 rounded-t-lg", config.bgColor)}>
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", config.color)} />
            <span className={cn("font-medium text-sm", config.color)}>{props.label}</span>
            <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
              {props.fieldCount}
            </Badge>
          </div>
        </div>
        <p className={cn("text-xs text-muted-foreground px-3 py-2 border-b", config.borderColor)}>
          {props.description}
        </p>
        <div className="p-3 space-y-3">{children}</div>
      </div>
    );
  }

  // Low confidence - collapsible
  return (
    <div className={cn("rounded-lg border", config.borderColor)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-t-lg transition-colors",
          config.bgColor,
          isOpen ? "rounded-b-none" : "rounded-b-lg"
        )}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon className={cn("size-4", config.color)} />
          <Icon className={cn("size-4", config.color)} />
          <span className={cn("font-medium text-sm", config.color)}>{props.label}</span>
          <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
            {props.fieldCount}
          </Badge>
        </div>
      </button>
      {isOpen && (
        <>
          <p className={cn("text-xs text-muted-foreground px-3 py-2 border-b", config.borderColor)}>
            {props.description}
          </p>
          <div className="p-3 space-y-3">{children}</div>
        </>
      )}
    </div>
  );
}

/**
 * Field update card component.
 */
export function FieldUpdateCardComponent({
  props,
}: {
  props: ComponentProps<"FieldUpdateCard">;
}) {
  const { state, dispatch, onAction } = useProfileAgentContext();
  const fieldState = state.fieldStates[props.fieldId] || { status: "pending" };
  const [editInput, setEditInput] = useState(String(props.proposedValue));
  const [editError, setEditError] = useState<string | null>(null);

  const handleSaveEdit = () => {
    if (isContactField(props.fieldKey)) {
      const result = validateContactField(props.fieldKey, editInput);
      if (result && !result.valid) {
        setEditError(result.error || "Invalid value");
        return;
      }
    }
    setEditError(null);
    onAction("editField", { fieldId: props.fieldId, value: editInput });
  };

  const handleCancelEdit = () => {
    setEditInput(String(fieldState.editedValue ?? props.proposedValue));
    setEditError(null);
    dispatch({ type: "SET_FIELD_EDITING", fieldId: props.fieldId, isEditing: false });
  };

  const displayValue = fieldState.editedValue !== undefined ? fieldState.editedValue : props.proposedValue;
  const currentDisplay = props.currentValue === null ? "(not set)" : String(props.currentValue);
  const proposedDisplay = String(displayValue);

  const confidenceColor = {
    high: "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20",
    medium: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
    low: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        fieldState.status === "accepted" && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        fieldState.status === "rejected" && "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60",
        fieldState.status === "pending" && "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{props.label}</span>
          <Badge variant="outline" className={cn("text-xs", confidenceColor[props.confidence])}>
            {props.confidence}
          </Badge>
        </div>
        {fieldState.status !== "pending" && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              fieldState.status === "accepted" && "text-green-600 border-green-200",
              fieldState.status === "rejected" && "text-red-600 border-red-200"
            )}
          >
            {fieldState.status}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="text-muted-foreground line-through">{currentDisplay}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        {fieldState.isEditing ? (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <Input
                value={editInput}
                onChange={(e) => {
                  setEditInput(e.target.value);
                  if (editError) setEditError(null);
                }}
                className="h-7 text-sm"
                autoFocus
                aria-invalid={!!editError}
              />
              <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 px-2">
                <Check className="size-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2">
                <X className="size-3" />
              </Button>
            </div>
            {editError && <p className="text-destructive text-xs">{editError}</p>}
          </div>
        ) : (
          <span className="font-medium">{proposedDisplay}</span>
        )}
      </div>

      {props.source && (
        <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
          &ldquo;{props.source}&rdquo;
        </p>
      )}

      {fieldState.status === "pending" && !fieldState.isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("acceptField", { fieldId: props.fieldId })}
            className="h-7 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Check className="size-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("rejectField", { fieldId: props.fieldId })}
            className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="size-3 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch({ type: "SET_FIELD_EDITING", fieldId: props.fieldId, isEditing: true })}
            className="h-7"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {fieldState.status !== "pending" && !fieldState.isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onAction(fieldState.status === "accepted" ? "rejectField" : "acceptField", { fieldId: props.fieldId })
            }
            className="h-7 text-muted-foreground"
          >
            {fieldState.status === "accepted" ? "Reject instead" : "Accept instead"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch({ type: "SET_FIELD_EDITING", fieldId: props.fieldId, isEditing: true })}
            className="h-7 text-muted-foreground"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Additional data card component.
 */
export function AdditionalDataCardComponent({
  props,
}: {
  props: ComponentProps<"AdditionalDataCard">;
}) {
  const { state, onAction } = useProfileAgentContext();
  const dataState = state.additionalDataStates[props.dataId] || { status: "pending" };
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(String(props.value));

  const handleSaveEdit = () => {
    onAction("editAdditionalData", { dataId: props.dataId, value: editInput });
    setIsEditing(false);
  };

  const displayValue = dataState.editedValue !== undefined ? dataState.editedValue : props.value;

  const confidenceColor = {
    high: "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20",
    medium: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
    low: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        dataState.status === "accepted" && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        dataState.status === "rejected" && "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60",
        dataState.status === "pending" && "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="size-3 text-muted-foreground" />
          <span className="font-medium text-sm">{props.label}</span>
          <Badge variant="outline" className={cn("text-xs", confidenceColor[props.confidence])}>
            {props.confidence}
          </Badge>
          {props.category && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {props.category}
            </Badge>
          )}
        </div>
        {dataState.status !== "pending" && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              dataState.status === "accepted" && "text-green-600 border-green-200",
              dataState.status === "rejected" && "text-red-600 border-red-200"
            )}
          >
            {dataState.status}
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-2 font-mono">{props.key}</p>

      <div className="flex items-center gap-2 text-sm mb-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-7 px-2">
              <Check className="size-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 px-2">
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <span className="font-medium">{String(displayValue)}</span>
        )}
      </div>

      {props.source && (
        <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
          &ldquo;{props.source}&rdquo;
        </p>
      )}

      {dataState.status === "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("acceptAdditionalData", { dataId: props.dataId })}
            className="h-7 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Check className="size-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("rejectAdditionalData", { dataId: props.dataId })}
            className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="size-3 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-7"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {dataState.status !== "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onAction(dataState.status === "accepted" ? "rejectAdditionalData" : "acceptAdditionalData", {
                dataId: props.dataId,
              })
            }
            className="h-7 text-muted-foreground"
          >
            {dataState.status === "accepted" ? "Reject instead" : "Accept instead"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-7 text-muted-foreground"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Note proposal card component.
 */
export function NoteProposalCardComponent({
  props,
}: {
  props: ComponentProps<"NoteProposalCard">;
}) {
  const { state, onAction } = useProfileAgentContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(String(state.noteState.editedValue ?? props.content));

  const handleSaveEdit = () => {
    onAction("editNote", { content: editInput });
    setIsEditing(false);
  };

  const displayContent = (state.noteState.editedValue as string) ?? props.content;

  const sourceLabel = {
    meeting: "Meeting Note",
    call: "Call Note",
    email: "Email",
    voice_note: "Voice Note",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        state.noteState.status === "accepted" && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        state.noteState.status === "rejected" && "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60",
        state.noteState.status === "pending" && "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StickyNote className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">Proposed Note</span>
          <Badge variant="outline" className="text-xs">
            {sourceLabel[props.source]}
          </Badge>
        </div>
        {state.noteState.status !== "pending" && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              state.noteState.status === "accepted" && "text-green-600 border-green-200",
              state.noteState.status === "rejected" && "text-red-600 border-red-200"
            )}
          >
            {state.noteState.status}
          </Badge>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveEdit} className="h-7">
              <Check className="size-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{displayContent}</p>
      )}

      {props.tags.length > 0 && !isEditing && (
        <div className="flex flex-wrap gap-1 mb-2">
          {props.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {state.noteState.status === "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("acceptNote", {})}
            className="h-7 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Check className="size-3 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("rejectNote", {})}
            className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="size-3 mr-1" />
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7">
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {state.noteState.status !== "pending" && !isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction(state.noteState.status === "accepted" ? "rejectNote" : "acceptNote", {})}
            className="h-7 text-muted-foreground"
          >
            {state.noteState.status === "accepted" ? "Reject instead" : "Accept instead"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 text-muted-foreground">
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Nudge question card component.
 */
export function NudgeQuestionCardComponent({
  props,
}: {
  props: ComponentProps<"NudgeQuestionCard">;
}) {
  const { state, onAction } = useProfileAgentContext();
  const nudgeState = state.nudgeStates[props.questionId] || { answer: null, skipped: false };
  const [input, setInput] = useState("");

  const isAnswered = nudgeState.answer && !nudgeState.skipped;
  const isSkipped = nudgeState.skipped;
  const isDone = isAnswered || isSkipped || state.isSubmitting;

  const handleSubmit = () => {
    if (input.trim()) {
      onAction("answerQuestion", { questionId: props.questionId, fieldKey: props.fieldKey, answer: input.trim() });
      setInput("");
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-3 transition-all",
        isDone && "opacity-60 bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs font-normal">
          {props.sectionLabel}
        </Badge>
        {isAnswered && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Check className="size-3" />
            <span>Answered</span>
          </div>
        )}
        {isSkipped && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <X className="size-3" />
            <span>Skipped</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium leading-snug">{props.question}</p>
        {props.description && <p className="text-xs text-muted-foreground mt-1">{props.description}</p>}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
        <HelpCircle className="size-3 mt-0.5 flex-shrink-0 text-muted-foreground/70" />
        <span>{props.why}</span>
      </div>

      {!isDone && (
        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-3 py-2 text-sm bg-background border rounded-md outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                handleSubmit();
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!input.trim()}>
              Answer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction("skipQuestion", { questionId: props.questionId, fieldKey: props.fieldKey })}
            >
              Skip
            </Button>
          </div>
        </div>
      )}

      {isAnswered && nudgeState.answer && (
        <div className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          <span className="text-green-700 dark:text-green-300">{nudgeState.answer}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Progress indicator component.
 */
export function ProgressIndicatorComponent({
  props,
}: {
  props: ComponentProps<"ProgressIndicator">;
}) {
  const dotsToShow = Math.min(props.total, 10);
  const remaining = props.total - props.answered - props.skipped;

  const parts: string[] = [];
  if (props.answered > 0) parts.push(`${props.answered} answered`);
  if (props.skipped > 0) parts.push(`${props.skipped} skipped`);
  if (remaining > 0) parts.push(`${remaining} remaining`);
  const statusText = parts.length > 0 ? parts.join(", ") : `${props.total} questions`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: dotsToShow }).map((_, i) => {
          let colorClass: string;
          if (i < props.answered) {
            colorClass = "bg-primary";
          } else if (i < props.answered + props.skipped) {
            colorClass = "bg-muted-foreground/50";
          } else {
            colorClass = "bg-muted-foreground/20";
          }
          return <div key={i} className={cn("size-1.5 rounded-full transition-colors", colorClass)} />;
        })}
      </div>
      <span className="text-xs text-muted-foreground">{statusText}</span>
    </div>
  );
}

/**
 * Additional data section header.
 */
export function AdditionalDataSectionComponent({
  children,
  count,
}: {
  children?: React.ReactNode;
  count: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-2 border-t">
        <Plus className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Additional Information</span>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {count} item{count !== 1 ? "s" : ""}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        These data points don&apos;t match standard profile fields but may be valuable.
      </p>
      {children}
    </div>
  );
}

/**
 * Interests section header.
 * (We render the items themselves in the tree; this component just provides the header copy.)
 */
export function InterestsSectionComponent({
  children,
  interests,
}: {
  children?: React.ReactNode;
  interests: Array<Record<string, unknown>>;
}) {
  const personalCount = interests.filter((i) => i.category === "personal").length;
  const financialCount = interests.filter((i) => i.category === "financial").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pt-2 border-t">
        <Heart className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Interests</span>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {interests.length} item{interests.length !== 1 ? "s" : ""}
        </Badge>
        <div className="ml-auto flex gap-1">
          {personalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Personal: {personalCount}
            </Badge>
          )}
          {financialCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Financial: {financialCount}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Suggested from notes. Confirm to add to the profile (only confirmed interests show up on the profile).
      </p>
      {children}
    </div>
  );
}

/**
 * Interest proposal card component.
 */
export function InterestProposalCardComponent({
  props,
}: {
  props: ComponentProps<"InterestProposalCard">;
}) {
  const { state, dispatch, onAction } = useProfileAgentContext();
  const interestState = state.interestStates[props.interestId] || { status: "pending" };

  const [labelInput, setLabelInput] = useState(
    String(interestState.editedLabel ?? props.label)
  );
  const [descriptionInput, setDescriptionInput] = useState(
    String(interestState.editedDescription ?? props.description ?? "")
  );

  const displayLabel = interestState.editedLabel ?? props.label;
  const displayDescription =
    interestState.editedDescription !== undefined ? interestState.editedDescription : props.description;

  const Icon = props.category === "personal" ? Heart : Briefcase;

  const confidenceColor = {
    high: "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20",
    medium: "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
    low: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20",
  };

  const handleSaveEdit = () => {
    onAction("editInterest", {
      interestId: props.interestId,
      label: labelInput.trim() || undefined,
      description: descriptionInput.trim() || undefined,
    });
  };

  const handleCancelEdit = () => {
    setLabelInput(String(interestState.editedLabel ?? props.label));
    setDescriptionInput(String(interestState.editedDescription ?? props.description ?? ""));
    dispatch({ type: "SET_INTEREST_EDITING", interestId: props.interestId, isEditing: false });
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        interestState.status === "accepted" && "border-green-200 bg-green-50/50 dark:bg-green-900/10",
        interestState.status === "rejected" && "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60",
        interestState.status === "pending" && "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate">{String(displayLabel)}</span>
          <Badge variant="outline" className={cn("text-xs", confidenceColor[props.confidence])}>
            {props.confidence}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {props.category}
          </Badge>
        </div>
        {interestState.status !== "pending" && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              interestState.status === "accepted" && "text-green-600 border-green-200",
              interestState.status === "rejected" && "text-red-600 border-red-200"
            )}
          >
            {interestState.status}
          </Badge>
        )}
      </div>

      {interestState.isEditing ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Label</p>
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Description (optional)</p>
            <Textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              className="min-h-[70px] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSaveEdit} className="h-7">
              <Check className="size-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {displayDescription && (
            <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{String(displayDescription)}</p>
          )}
          {props.sourceText && (
            <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
              &ldquo;{props.sourceText}&rdquo;
            </p>
          )}
        </>
      )}

      {interestState.status === "pending" && !interestState.isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("acceptInterest", { interestId: props.interestId })}
            className="h-7 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Check className="size-3 mr-1" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("rejectInterest", { interestId: props.interestId })}
            className="h-7 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X className="size-3 mr-1" />
            Dismiss
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch({ type: "SET_INTEREST_EDITING", interestId: props.interestId, isEditing: true })}
            className="h-7"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      {interestState.status !== "pending" && !interestState.isEditing && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onAction(interestState.status === "accepted" ? "rejectInterest" : "acceptInterest", {
                interestId: props.interestId,
              })
            }
            className="h-7 text-muted-foreground"
          >
            {interestState.status === "accepted" ? "Dismiss instead" : "Confirm instead"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch({ type: "SET_INTEREST_EDITING", interestId: props.interestId, isEditing: true })}
            className="h-7 text-muted-foreground"
          >
            <Pencil className="size-3 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
