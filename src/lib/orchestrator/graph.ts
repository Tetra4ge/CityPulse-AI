import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { CityPulseStateAnnotation } from "./state";
import { 
  ingestNode, 
  triageNode, 
  forecastNode, 
  resourceNode,
  decisionNode, 
  reflectionNode,
  explainabilityNode
} from "./nodes";

// 1. Initialize the StateGraph with our defined state channels and chain methods
const workflow = new StateGraph(CityPulseStateAnnotation)
  // 2. Add all the Agent nodes to the graph
  .addNode("ingest", ingestNode)
  .addNode("triage", triageNode)
  .addNode("forecast", forecastNode)
  .addNode("resource", resourceNode)
  .addNode("decision", decisionNode)
  .addNode("reflection", reflectionNode)
  .addNode("explainability", explainabilityNode)
  
  // 3. Define the edges (the execution flow)
  .addEdge(START, "ingest")
  .addEdge("ingest", "triage")
  .addEdge("triage", "forecast")
  .addEdge("forecast", "resource")
  .addEdge("resource", "decision")
  .addEdge("decision", "reflection")
  .addEdge("reflection", "explainability")
  .addEdge("explainability", END);

// 4. Initialize Checkpointer for Human-in-the-Loop state persistence
const memory = new MemorySaver();

// 5. Compile the graph into an executable application, pausing before reflection
export const appGraph = workflow.compile({
  checkpointer: memory,
  interruptBefore: ["reflection"]
});

