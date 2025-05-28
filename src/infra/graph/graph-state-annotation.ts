import { ActionType } from "@enum/ActionType";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  action: Annotation<ActionType>,
  input: Annotation<string>,
  output: Annotation<string>,
  tenantId: Annotation<number>,
});