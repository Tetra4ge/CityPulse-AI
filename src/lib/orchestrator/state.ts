import { Annotation } from "@langchain/langgraph";
import type { 
  IngestionOutput, 
  TriageOutput, 
  ForecastOutput, 
  DecisionOutput, 
  ReflectionOutput,
  ResourceOutput,
  ExplainabilityOutput
} from "@/lib/types/agent-schemas";

/**
 * CityPulseStateAnnotation
 * 
 * Defines the state channels that are passed between our Multi-Agent nodes in LangGraph.
 * As the graph executes, each node will write its results back into this state,
 * which is then passed to the next node.
 */
export const CityPulseStateAnnotation = Annotation.Root({
  zone: Annotation<string>,
  decisionId: Annotation<string>,
  lat: Annotation<number | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  lng: Annotation<number | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  ingestionResult: Annotation<IngestionOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  triageResult: Annotation<TriageOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  forecastResult: Annotation<ForecastOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  resourceResult: Annotation<ResourceOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  decisionResult: Annotation<DecisionOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  reflectionResult: Annotation<ReflectionOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  }),
  explainabilityResult: Annotation<ExplainabilityOutput | null>({
    default: () => null,
    reducer: (oldState, newState) => newState ?? oldState
  })
});

/**
 * TypeScript type representing the fully resolved State object.
 * This is used to strongly type the inputs and outputs of our LangGraph nodes.
 */
export type CityPulseState = typeof CityPulseStateAnnotation.State;
