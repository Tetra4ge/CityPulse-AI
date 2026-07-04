import { StateGraph, START, END } from "@langchain/langgraph";
import { CityPulseStateAnnotation } from "./state";
import { 
  ingestNode, 
  triageNode, 
  forecastNode, 
  decisionNode, 
  reflectionNode 
} from "./nodes";

// 1. Initialize the StateGraph with our defined state channels and chain methods
const workflow = new StateGraph(CityPulseStateAnnotation)
  // 2. Add all the Agent nodes to the graph
  .addNode("ingest", ingestNode)
  .addNode("triage", triageNode)
  .addNode("forecast", forecastNode)
  .addNode("decision", decisionNode)
  .addNode("reflection", reflectionNode)
  
  // 3. Define the edges (the execution flow)
  .addEdge(START, "ingest")
  .addEdge("ingest", "triage")
  .addEdge("triage", "forecast")
  .addEdge("forecast", "decision")
  .addEdge("decision", "reflection")
  .addEdge("reflection", END);

// 4. Compile the graph into an executable application
export const appGraph = workflow.compile();

