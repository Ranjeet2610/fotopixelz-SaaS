import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth";
import {
  createMembershipHandler,
  createOrganizationHandler,
  deleteMembershipHandler,
  deleteOrganizationHandler,
  getOrganizationHandler,
  getOrganizationsHealth,
  listMembershipsHandler,
  listOrganizationsHandler,
  updateMembershipHandler,
  updateOrganizationHandler,
} from "./organizations.controller";

const organizationsRouter = Router();

organizationsRouter.get("/health", getOrganizationsHealth);

organizationsRouter.use(requireAuth);

organizationsRouter.get("/", listOrganizationsHandler);
organizationsRouter.post("/", createOrganizationHandler);

organizationsRouter.get("/:organizationId", getOrganizationHandler);
organizationsRouter.patch("/:organizationId", updateOrganizationHandler);
organizationsRouter.delete("/:organizationId", deleteOrganizationHandler);

organizationsRouter.get("/:organizationId/memberships", listMembershipsHandler);
organizationsRouter.post("/:organizationId/memberships", createMembershipHandler);
organizationsRouter.patch(
  "/:organizationId/memberships/:membershipId",
  updateMembershipHandler,
);
organizationsRouter.delete(
  "/:organizationId/memberships/:membershipId",
  deleteMembershipHandler,
);

export default organizationsRouter;
