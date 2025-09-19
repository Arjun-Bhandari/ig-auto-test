
export interface CommentTrigger {
    type: "comment_created";
    mediaId: string;
    match?: {
      contains?: string[];
      include?: string[]; // Client format
      regex?: string;
      // exclude?: string[]; // Commented out as requested
    };
  }
  
  export interface ActionCommentReply {
    type: "comment_reply";
    text: string;
    // Support client-side fields
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
  
  export interface AutomationCreateInput {
    igUserId: string; // string in API
    mediaId: string;
    templateId: string;
    rule: AutomationRulePayload;
  }
  
  export interface AutomationRecord {
    id: string;
    igUserId: string; 
    mediaId: string;
    templateId: string;
    rule: AutomationRulePayload;
    createdAt: string;
    updatedAt: string;
  }