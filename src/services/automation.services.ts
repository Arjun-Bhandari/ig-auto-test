
// import { prisma } from "../lib/db";
// import { AutomationRulePayload, AutomationRecord } from "../types/automation";

// export const createAutomationRule = async (params: {
//   igUserId: bigint;
//   mediaId: string;
//   name: string;
//   templateId: string;
//   rule: AutomationRulePayload;
// }): Promise<AutomationRecord> => {
//   const created = await prisma.automation.create({
//     data: {
//       igUserId: params.igUserId,
//       name: params.name,
//       mediaId: params.mediaId,
//       templateId: params.templateId,
//       rule: params.rule as unknown as any, // Prisma Json
//     },
//   });
//   return {
//     id: created.id,
//     igUserId: created.igUserId.toString(),
//     mediaId: created.mediaId,
//     templateId: params.templateId,
//     rule: created.rule as unknown as AutomationRulePayload,
//     createdAt: created.createdAt.toISOString(),
//     updatedAt: created.updatedAt.toISOString(),
//   };
// };

// export const listAutomationRulesByUser = async (igUserId: bigint): Promise<AutomationRecord[]> => {
//   const rows = await prisma.automation.findMany({
//     where: { igUserId },
//     orderBy: { createdAt: "desc" },
//   });
//   return rows.map((r) => ({
//     id: r.id,
//     igUserId: r.igUserId.toString(),
//     mediaId: r.mediaId,
//     templateId: "", // not stored in current model; keep blank or store it if you add column
//     rule: r.rule as unknown as AutomationRulePayload,
//     createdAt: r.createdAt.toISOString(),
//     updatedAt: r.updatedAt.toISOString(),
//   }));
// };


import { prisma } from "../lib/db";
import { 
  AutomationRulePayload, 
  AutomationRecord, 
  AutomationCreateInput,
  AutomationUpdateInput,
  AutomationExecutionUpdate,
  AutomationStatus
} from "../types/automation";

export const createAutomationRule = async (params: AutomationCreateInput): Promise<AutomationRecord> => {
  const created = await prisma.automation.create({
    data: {
      igUserId: BigInt(params.igUserId),
      name: params.name,
      mediaId: params.mediaId,
     
      rule: params.rule as unknown as any,
      status: params.status || "DRAFT",
      isActive: params.isActive || false,
    },
  });
  
  return mapAutomationRecord(created);
};

export const listAutomationRulesByUser = async (
  igUserId: bigint, 
): Promise<AutomationRecord[]> => {
  const whereClause: any = { igUserId };

  console.log(whereClause);
  const rows = await prisma.automation.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });
  
  return rows.map(mapAutomationRecord);
};

export const getAutomationById = async (id: string): Promise<AutomationRecord | null> => {
  const automation = await prisma.automation.findUnique({
    where: { id },
  });
  
  if (!automation) return null;
  return mapAutomationRecord(automation);
};

export const updateAutomationStatus = async (
  id: string, 
  updateData: { status?: AutomationStatus; isActive?: boolean }
): Promise<AutomationRecord | null> => {
  const updated = await prisma.automation.update({
    where: { id },
    data: {
      status: updateData.status,
      isActive: updateData.isActive,
    },
  });
  
  return mapAutomationRecord(updated);
};

export const updateAutomation = async (
  id: string, 
  updateData: Omit<AutomationUpdateInput, 'id'>
): Promise<AutomationRecord | null> => {
  const updated = await prisma.automation.update({
    where: { id },
    data: {
      name: updateData.name,
      rule: updateData.rule as unknown as any,

      status: updateData.status,
      isActive: updateData.isActive,
    },
  });
  
  return mapAutomationRecord(updated);
};

export const updateAutomationExecution = async (
  id: string, 
  executionData: AutomationExecutionUpdate
): Promise<AutomationRecord | null> => {
  const updated = await prisma.automation.update({
    where: { id },
    data: {
      lastExecutedAt: executionData.lastExecutedAt,
      executionCount: executionData.executionCount,
      errorCount: executionData.errorCount,
      lastErrorAt: executionData.lastErrorAt,
      lastErrorMessage: executionData.lastErrorMessage,
    },
  });
  
  return mapAutomationRecord(updated);
};

export const deleteAutomation = async (id: string): Promise<boolean> => {
  try {
    await prisma.automation.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const getActiveAutomationsByMediaId = async (mediaId: string): Promise<AutomationRecord[]> => {
  const automations = await prisma.automation.findMany({
    where: {
      mediaId,
      status: "ACTIVE",
      isActive: true,
    },
  });
  
  return automations.map(mapAutomationRecord);
};

// Helper function to map database record to API response
const mapAutomationRecord = (record: any): AutomationRecord => ({
  id: record.id,
  igUserId: record.igUserId.toString(),
  mediaId: record.mediaId,
  name: record.name,

  rule: record.rule as unknown as AutomationRulePayload,

  status: record.status,
  isActive: record.isActive,
  lastExecutedAt: record.lastExecutedAt?.toISOString(),
  executionCount: record.executionCount,
  errorCount: record.errorCount,
  lastErrorAt: record.lastErrorAt?.toISOString(),
  lastErrorMessage: record.lastErrorMessage,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});
