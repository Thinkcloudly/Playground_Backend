import express, { Router, Request, Response } from 'express';
import scenario1Controller from './scenario1.controller';
import scenario2Controller from './scenario2.controller';
let router = Router();
router.use("/", scenario1Controller);
router.use("/", scenario2Controller);
export default router
export const scenarioControllers = router;