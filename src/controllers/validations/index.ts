import express, { Router, Request, Response } from 'express';
import scenario1Controller from './scenario1.controller';
import scenario2Controller from './scenario2.controller';
import scenario3Controller from './scenario3.controller';

let router = Router();
router.use("/testEnv1", scenario1Controller);
router.use("/testEnv2", scenario2Controller);
router.use("/testEnv3", scenario3Controller);
export default router
export const scenarioControllers = router;