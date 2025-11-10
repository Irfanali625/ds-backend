import { Router } from "express";
import { WebhookController } from "../controllers/webhookController";

const router = Router();
const webhookController = new WebhookController();

router.post("/stripe", (req, res) => webhookController.stripe(req, res));
router.post("/square", (req, res) => webhookController.square(req, res));

export default router;

