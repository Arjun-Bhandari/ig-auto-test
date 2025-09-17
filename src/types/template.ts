
export interface FlowNode {
    id: string;
    kind: "trigger" | "comment_reply" | "dm_message";
    label: string;
    config: Record<string, unknown>;
  }
  
  export interface FlowEdge {
    from: string;
    to: string;
  }
  
  export interface TemplateBody {
    type: "comment-reply" | "comment-reply+dm";
    nodes: FlowNode[];
    edges: FlowEdge[];
  }
  
  export interface TemplateCreateInput {
    name: string;
    type: TemplateBody["type"];
    body: TemplateBody;
  }
  
  export interface TemplateRecord {
    id: string;
    name: string;
    body: TemplateBody;
    createdAt: string;
    updatedAt: string;
  }