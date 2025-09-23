// // src/routes/automation.routes.ts
// import { FastifyInstance } from "fastify";
// import { createAutomationController, listAutomationByUserController } from "../controllers/automation.contoller";
// import { createRuleSchema,listAutomationQuerySchema } from "../schema/automation";

// export const automationRoute = async (app: FastifyInstance) => {
//   app.post(
//     "/automation-rules",
//     {
//       schema: { body: createRuleSchema },
//     },
//     createAutomationController
//   );

//   app.get(
//     "/automation-rules",
//     {
//       schema: {
//         querystring: listAutomationQuerySchema
//       },
//     },
//     listAutomationByUserController
//   );
// };


// src/routes/automation.routes.ts
import { FastifyInstance } from "fastify";
import { 
  createAutomationController, 
  listAutomationByUserController,
  getAutomationController,
  updateAutomationStatusController,
  updateAutomationExecutionController,
  deleteAutomationController
} from "../controllers/automation.contoller";
import { 
  createRuleSchema,
  listAutomationQuerySchema,
  getAutomationParamsSchema,
  updateAutomationStatusSchema,
  updateExecutionSchema
} from "../schema/automation";

export const automationRoute = async (app: FastifyInstance) => {
  // Create automation rule
  app.post(
    "/automation-rules",
    {
      schema: { 
        body: createRuleSchema,
        
      },
    },
    createAutomationController
  );

  // List automation rules by user with filtering
  app.get(
    "/automation-rules",
    {
      schema: {
        querystring: listAutomationQuerySchema,
       
      },
    },
    listAutomationByUserController
  );

  // Get automation by ID
  app.get(
    "/automation-rules/:id",
    {
      schema: {
        params: getAutomationParamsSchema,
       
      }
    },
    getAutomationController
  );

  // Update automation status (DRAFT, ACTIVE, PAUSED, ARCHIVED)
  app.patch(
    "/automation-rules/:id/status",
    {
      schema: { 
        params: getAutomationParamsSchema,
        body: updateAutomationStatusSchema,
      
      },
    },
    updateAutomationStatusController
  );

  // Update automation execution tracking
  app.patch(
    "/automation-rules/:id/execution",
    {
      schema: { 
        body: updateExecutionSchema,
       
      },
    },
    updateAutomationExecutionController
  );

  // Delete automation
  app.delete(
    "/automation-rules/:id",
    {
      schema: {
        params: getAutomationParamsSchema,
       
      }
    },
    deleteAutomationController
  );
};