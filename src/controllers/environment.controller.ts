import express, { Router, Request, Response } from 'express';
// import SDK
import {
    CloudFormationClient,
    DescribeStacksCommand,
    CreateStackCommand,
    CreateStackCommandInput,
    DescribeStacksInput,
    DeleteStackCommand,
    DeleteStackCommandInput
} from "@aws-sdk/client-cloudformation";
import { scenario1Controller } from './validations/scenario1.controller';

declare module "express-serve-static-core" {
    interface Request {
        awsClient?: CloudFormationClient;
    }
}
let router = Router();

router.post('/setup-env', async (req: Request, res: Response) => {
    // a client can be shared by different commands.
    let { environment, userId, region, resources } = req.body;
    if (!environment || !userId || !region || !resources) {
        res.status(400).send('Missing environment or userId');
        return;
    }

    let template: any = {
        Resources: {}
    };
    (resources as string[]).forEach((resource: any, i) => {
        template.Resources[`${req.body.environment}${req.body.userId}Ts${Date.now()}${i}`] = {
            Type: resource.type,
            Properties: {
                ...(resource.properties || {}),
            }
        }
    })
    const params: CreateStackCommandInput = {
        StackName: `environment-${req.body.environment}-${req.body.userId}-${Date.now()}`,
        OnFailure: "DELETE",
        TemplateBody: JSON.stringify(template)
    };
    const command = new CreateStackCommand(params);
    // async/await.
    try {
        const data = await req.awsClient.send(command);
        res.send({ ...data });
        // process data.
    } catch (error: any) {
        // error handling.
        const { requestId, cfId, extendedRequestId } = error.$metadata;
        console.log({ requestId, cfId, extendedRequestId });
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         *     const value = error.specialKeyInException;
         * }
         */

    }
});

router.post('/validate-env', async (req: Request, res: Response) => {
    let { stackId } = req.body;
    if (!stackId) {
        res.status(400).send('Missing environment or userId');
        return;
    }
    const params: DescribeStacksInput = {
        StackName: `${stackId}`
    };
    const command = new DescribeStacksCommand(params);
    // async/await.
    try {
        const data = await req.awsClient.send(command);
        res.send({ ...data });
        // process data.
    } catch (error: any) {
        // error handling.
        const { requestId, cfId, extendedRequestId } = error.$metadata;
        console.log({ requestId, cfId, extendedRequestId });
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         * 
         **/
    }
});

router.post('/delete-env', async (req: Request, res: Response) => {
    let { stackId } = req.body;
    if (!stackId) {
        res.status(400).send('Missing environment or userId');
        return;
    }
    const params: DeleteStackCommandInput = {
        StackName: `${stackId}`
    };
    const command = new DeleteStackCommand(params);
    // async/await.
    try {
        const data = await req.awsClient.send(command);
        res.send({ ...data });
        // process data.
    } catch (error: any) {
        // error handling.
        const { requestId, cfId, extendedRequestId } = error.$metadata;
        console.log({ requestId, cfId, extendedRequestId });
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         * 
         **/
    }
});

router.use("/", scenario1Controller);


export default router;
export const environmentController = router;
