
import { prisma } from "../lib/db";
import { AutomationRulePayload, AutomationRecord } from "../types/automation";

export const createAutomationRule = async (params: {
  igUserId: bigint;
  mediaId: string;
  templateId: string;
  rule: AutomationRulePayload;
}): Promise<AutomationRecord> => {
  const created = await prisma.automationRule.create({
    data: {
      igUserId: params.igUserId,
      mediaId: params.mediaId,
      rule: params.rule as unknown as any, // Prisma Json
    },
  });
  return {
    id: created.id,
    igUserId: created.igUserId.toString(),
    mediaId: created.mediaId,
    templateId: params.templateId,
    rule: created.rule as unknown as AutomationRulePayload,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
};

export const listAutomationRulesByUser = async (igUserId: bigint): Promise<AutomationRecord[]> => {
  const rows = await prisma.automationRule.findMany({
    where: { igUserId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    igUserId: r.igUserId.toString(),
    mediaId: r.mediaId,
    templateId: "", // not stored in current model; keep blank or store it if you add column
    rule: r.rule as unknown as AutomationRulePayload,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
};