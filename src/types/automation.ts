
// export interface CommentTrigger {
//     type: "comment_created";
//     mediaId: string;
//     match?: {
//       contains?: string[];
//       include?: string[]; // Client format
//       regex?: string;
//       // exclude?: string[]; // Commented out as requested
//     };
//   }
  
//   export interface ActionCommentReply {
//     type: "comment_reply";
//     text: string;
//     // Support client-side fields
//     responses?: string[];
//     randomize?: boolean;
//   }
  
//   export interface ActionSendDM {
//     type: "send_dm";
//     text: string;
//     buttons?: Array<{ type: "url"; label: string; url: string }>;
//   }
  
//   export interface AutomationRulePayload {
//     trigger: CommentTrigger;
//     actions: Array<ActionCommentReply | ActionSendDM>;
//   }
  
//   export interface AutomationCreateInput {
//     igUserId: string; // string in API
//     mediaId: string;
//     templateId: string;
//     rule: AutomationRulePayload;
//   }
  
//   export interface AutomationRecord {
//     id: string;
//     igUserId: string; 
//     mediaId: string;
//     templateId: string;
//     rule: AutomationRulePayload;
//     createdAt: string;
//     updatedAt: string;
//   }


export interface CommentTrigger {
  type: "comment_created";
  mediaId: string;
  match?: {
    contains?: string[];
    include?: string[]; // Client format
    regex?: string;
  };
}

export interface ActionCommentReply {
  type: "comment_reply";
  text?: string;
  responses?: string[];
  randomize?: boolean;
}

export interface ActionSendDM {
  type: "send_dm";
  text: string;
  buttons?: Array<{ type: "url"; label: string; url: string }>;
}

export interface AutomationRulePayload {
  trigger: CommentTrigger;
  actions: Array<ActionCommentReply | ActionSendDM>;
}

export type AutomationStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export interface AutomationCreateInput {
  igUserId: string; // string in API
  mediaId: string;
  name: string;
  rule: AutomationRulePayload;
  campaignType:string;
  status?: AutomationStatus;
  isActive?: boolean;
}

export interface AutomationRecord {
  id: string;
  igUserId: string; 
  mediaId: string;
  name: string;
  campaignType:string;
  rule: AutomationRulePayload;
  status: AutomationStatus;
  isActive: boolean;
  lastExecutedAt?: string;
  executionCount: number;
  errorCount: number;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationUpdateInput {
  id: string;
  name?: string;
  rule?: AutomationRulePayload;
  campaignType?:string;
  status?: AutomationStatus;
  isActive?: boolean;
}

export interface AutomationExecutionUpdate {
  id: string;
  lastExecutedAt?: Date;
  executionCount?: number;
  errorCount?: number;
  lastErrorAt?: Date;
  lastErrorMessage?: string;
}