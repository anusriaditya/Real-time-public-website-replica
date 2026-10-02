import { Router } from "express";
import { getServiceAlert, getServiceAlerts } from "./service-status.controller.js";

export const serviceStatusRouter = Router();

serviceStatusRouter.get("/", getServiceAlerts);
serviceStatusRouter.get("/:id", getServiceAlert);
