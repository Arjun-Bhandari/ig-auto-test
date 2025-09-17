export interface AutomationPreset {
  id: string;
  label: string;
  type: "comment-reply" | "comment-reply+dm";
  description?: string;
}

export const AUTOMATION_PRESETS: AutomationPreset[] = [
  {
    id: "comment-reply",
    label: "Reply to Comment",
    type: "comment-reply",
    description: "Automatically reply to comments that match keywords or regex.",
  },
  {
    id: "comment-reply+dm",
    label: "Reply to Comment + Send DM",
    type: "comment-reply+dm",
    description: "Reply publicly and follow up with a DM that can include a link button.",
  },
];


