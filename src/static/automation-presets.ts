// src/static/automation-presets.ts
export const AUTOMATION_PRESETS = [
  {
    id: "comment-reply",
    title: "Reply to Comment",
    description: "Automatically reply to comments that match keywords",
    type: "comment-reply",
    icon: "MessageCircle",
    goals: ["Grow Engagement"],
    triggers: ["Comment"],
    templateConfig: {
      hasKeywords: true,
      hasCustomMessage: true,
      hasRandomMessage: true,
      hasMediaSelection: true
    }
  },
  {
    id: "comment-reply-dm",
    title: "Reply to Comment + Send DM", 
    description: "Reply publicly and follow up with a DM",
    type: "comment-reply+dm",
    icon: "MessageSquare",
    goals: ["Grow Engagement", "Grow Conversion"],
    triggers: ["Comment"],
    templateConfig: {
      hasKeywords: true,
      hasCustomMessage: true,
      hasRandomMessage: true,
      hasMediaSelection: true,
      hasDmMessage: true,
      hasDmButtons: true
    }
  }
];