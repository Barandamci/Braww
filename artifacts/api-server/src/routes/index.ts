import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import otpRouter from "./otp.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(otpRouter);

export default router;
