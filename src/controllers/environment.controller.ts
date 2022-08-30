import express, { Router, Request, Response } from 'express';
// import SDK
import {
    CloudFormationClient,
    DescribeStacksCommand,
    CreateStackCommand,
    CreateStackCommandInput,
    DescribeStacksInput,
    DeleteStackCommand,
    DeleteStackCommandInput,
    DescribeStackResourcesCommandInput,
    DescribeStackResourcesCommand
} from "@aws-sdk/client-cloudformation";
import { IAMClient, CreateUserCommand, CreateLoginProfileCommand, DeleteUserCommand, DeleteLoginProfileCommand, AttachUserPolicyCommand, DetachUserPolicyCommand } from "@aws-sdk/client-iam"; // ES Modules 
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

        const iamClient = new IAMClient({
            "credentials": {
                accessKeyId: `${process.env.AWS_ID}`,
                secretAccessKey: `${process.env.AWS_SECRET}`
            },
            region: `${process.env.AWS_ENV_REGION}`
        });
        const createUsercommand = new CreateUserCommand({
            UserName: `${req.body.environment}-${req.body.userId}-${Date.now()}`
        });
        const createUserresponse = await iamClient.send(createUsercommand);
        let password = `${req.body.environment}-${req.body.userId}-${Date.now()}`
        const createLoginProfileCommand = new CreateLoginProfileCommand({
            UserName: createUserresponse.User.UserName,
            Password: password,
            PasswordResetRequired: false
        });
        const createLoginProfileResponse = await iamClient.send(createLoginProfileCommand);
        console.log(createLoginProfileResponse);
        const attachUserPolicyCommand = new AttachUserPolicyCommand({
            UserName: createUserresponse.User.UserName,
            PolicyArn: "arn:aws:iam::aws:policy/PowerUserAccess"
        });
        const attachUserPolicyResponse = await iamClient.send(attachUserPolicyCommand);
        console.log(attachUserPolicyResponse);

        res.send({
            ...data,
            iamUser: {
                userName: createUserresponse.User.UserName,
                password: password
            }
        });
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
        res.status(500).send({ ...error })

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
        let resp: any = { StackStatus: data.Stacks[0].StackStatus, ...data }
        if (data.Stacks[0].StackStatus == "CREATE_COMPLETE") {
            const params: DescribeStackResourcesCommandInput = {
                StackName: `${stackId}`
            };
            const command = new DescribeStackResourcesCommand(params);
            const data = await req.awsClient.send(command);
            return res.send({ ...resp, StackResources: data.StackResources });

        }
        res.send(res);
        // process data.
    } catch (error: any) {
        // error handling.
        if (error.$metadata) {
            const { requestId, cfId, extendedRequestId } = error.$metadata;
            console.log({ requestId, cfId, extendedRequestId });
        }
        res.status(500).send({ ...error })
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         * 
         **/
    }
});
router.post('/env-res', async (req: Request, res: Response) => {
    let { stackId } = req.body;
    if (!stackId) {
        res.status(400).send('Missing environment or userId');
        return;
    }
    const params: DescribeStackResourcesCommandInput = {
        StackName: `${stackId}`
    };
    const command = new DescribeStackResourcesCommand(params);
    // async/await.
    try {
        const data = await req.awsClient.send(command);

        return res.send({ ...data });
        // process data.
    } catch (error: any) {
        // error handling.
        const { requestId, cfId, extendedRequestId } = error.$metadata;
        console.log({ requestId, cfId, extendedRequestId });
        return res.status(500).send({ ...error })
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         * 
         **/
    }
});
router.post('/delete-env', async (req: Request, res: Response) => {
    let { stackId, iamUserId } = req.body;
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
        const iamClient = new IAMClient({
            "credentials": {
                accessKeyId: `${process.env.AWS_ID}`,
                secretAccessKey: `${process.env.AWS_SECRET}`
            },
            region: `${process.env.AWS_ENV_REGION}`
        });

        const deleteLoginProfileCommand = new DeleteLoginProfileCommand({
            UserName: `${iamUserId}`
        });
        const deleteLoginProfileResponse = await iamClient.send(deleteLoginProfileCommand);
        console.log(deleteLoginProfileResponse);

        const detachPolicyCommand = new DetachUserPolicyCommand({
            UserName: `${iamUserId}`,
            PolicyArn: "arn:aws:iam::aws:policy/PowerUserAccess"
        });
        const detachPolicyResponse = await iamClient.send(detachPolicyCommand);
        console.log(detachPolicyResponse);

        const deleteUserCommand = new DeleteUserCommand({
            UserName: `${iamUserId}`
        });
        const deleteUserResponse = await iamClient.send(deleteUserCommand);
        console.log(deleteUserResponse);
        return res.send({ ...data });
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
        res.status(500).send({ ...error })
    }
});

router.use("/", scenario1Controller);


export default router;
export const environmentController = router;
