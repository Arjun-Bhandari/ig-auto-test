
import { prisma } from "../lib/db";
import { TemplateBody, TemplateCreateInput, TemplateRecord } from "../types/template";

export const createTemplate = async (input: TemplateCreateInput): Promise<TemplateRecord> => {
  const created = await prisma.template.create({
    data: {
      name: input.name,
      body: JSON.stringify(input.body),
    },
  });
  return {
    id: created.id,
    name: created.name,
    body: JSON.parse(created.body) as TemplateBody,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
};

export const getTemplateById = async (id: string): Promise<TemplateRecord | null> => {
  const found = await prisma.template.findUnique({ where: { id } });
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    body: JSON.parse(found.body) as TemplateBody,
    createdAt: found.createdAt.toISOString(),
    updatedAt: found.updatedAt.toISOString(),
  };
};