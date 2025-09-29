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
  deleteAutomationController,
  updateAutomationController
} from "../controllers/automation.contoller";
import { 
  createRuleSchema,
  listAutomationQuerySchema,
  getAutomationParamsSchema,
  updateAutomationStatusSchema,
  updateExecutionSchema,
  updateAutomationSchema
} from "../schema/automation";

export const automationRoute = async (app: FastifyInstance) => {
  // Create automation rule
  app.post(
    "/automation",
    {
      schema: { 
        body: createRuleSchema,
        
      },
    },
    createAutomationController
  );

  // List automation rules by user with filtering
  app.get(
    "/automation",
    {
      schema: {
        querystring: listAutomationQuerySchema,
       
      },
    },
    listAutomationByUserController
  );

  // Get automation by ID
  app.get(
    "/automation/:id",
    {
      schema: {
        params: getAutomationParamsSchema,
       
      }
    },
    getAutomationController
  );

  // Update automation status (DRAFT, ACTIVE, PAUSED, ARCHIVED)
  app.patch(
    "/automation/:id/status",
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
    "/automation/:id/execution",
    {
      schema: { 
        body: updateExecutionSchema,
       
      },
    },
    updateAutomationExecutionController
  );

  app.put(
    "/automation/:id",
    {
      schema: {
        body: updateAutomationSchema,
        params: getAutomationParamsSchema,
      },
    },
    updateAutomationController
  );
  
  // Delete automation
  app.delete(
    "/automation/:id",
    {
      schema: {
        params: getAutomationParamsSchema,
       
      }
    },
    deleteAutomationController
  );
};