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
import {
    IAMClient,
    CreateUserCommand,
    CreateLoginProfileCommand,
    DeleteUserCommand,
    DeleteLoginProfileCommand,
    AttachUserPolicyCommand,
    DetachUserPolicyCommand
} from "@aws-sdk/client-iam"; // ES Modules 

declare module "express-serve-static-core" {
    interface Request {
        awsClient?: CloudFormationClient;
    }
}
let router = Router();

function updateRef(obj: any, mapping: (ref: string) => string) {
    for (var k in obj) {
        if (typeof obj[k] === "object" && obj[k] !== null)
            updateRef(obj[k], mapping);
        else {
            // do something... 
            if (typeof obj[k] === 'string' && (k === 'Ref' || k === 'DependsOn')) {
                obj[k] = mapping(obj[k])
            }
        }
    }
}

/**
 * @openapi
 * /setup-env:
 *   post:
 *     description: Setup environments for playground secarios!
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user's id.
 *                 example: user123
 *               environment:
 *                 type: string
 *                 description: environment name
 *                 example: test env
 *               region:
 *                 type: string
 *                 description: aws region name
 *                 example: us-east-1
 *               resources:
 *                 type: array
 *                 description: Resource items
 *                 items:
 *                    type: object
 * 
 *     responses:
 *       200:
 *         description: Returns a status of the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StackId:
 *                   type: string
 *                   description: stack id
 *                   example: arn:aws:cloudformation:xxx:stack/xxxx/dd500ed0-288b-11ed-a3a1-129093a8b44d
 *                 iamUser:
 *                   type: object
 *                   descriotion: user login details
 *                   properties:
 *                     userName:
 *                       type: string
 *                       description: user Id
 *                       example: testEnv-user123-1661881669838
 *                     password:
 *                       type: string
 *                       description: user password
 *                       example: testEnv-user123-1661881669838
 * 
 */
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
    let Id = `${req.body.environment}${req.body.userId}Ts${Date.now()}`;
    (resources as string[]).forEach((resource: any, i) => {
        template.Resources[`${resource.id || ''}${Id}`] = {
            Type: resource.type,
            Properties: {
                ...(resource.properties || {}),
            }
        }
        if (resource.dependsOn) {
            template.Resources[`${resource.id || ''}${Id}`].DependsOn = resource.dependsOn
        }
    })
    let username = `${Date.now()}`
    let password = `Pass-${userId}-${Date.now()}`
    template.Resources[`iamuser${Id}`] = {
        Type: "AWS::IAM::User",
        Properties: {
            UserName: username,
            LoginProfile: {
                Password: password,
                PasswordResetRequired: false
            },
            ManagedPolicyArns: ["arn:aws:iam::aws:policy/PowerUserAccess"],
            // PermissionsBoundary: "arn:aws:iam::aws:policy/PowerUserAccess",
        }
    }
    updateRef(template, (ref) => `${ref}${Id}`);

    const params: CreateStackCommandInput = {
        StackName: `tc-user-env-${req.body.environment}-${req.body.userId}-${Date.now()}`,
        OnFailure: "DELETE",
        TemplateBody: JSON.stringify(template),
        Tags: [
            {
                Key: "STACK TYPE",
                Value: "TC:USER:ENV"
            },
            {
                Key: "STACK USER",
                Value: username
            }
        ],
        Capabilities: [
            'CAPABILITY_NAMED_IAM'
        ]
    };
    const command = new CreateStackCommand(params);
    // async/await.
    try {
        const data = await req.awsClient.send(command);
        res.send({
            ...data,
            iamUser: {
                userName: username,
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

/**
 * @openapi
 * /validate-env:
 *   post:
 *     description: Validate environments for playground secarios!
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stackId:
 *                 type: string
 *                 description: The aws stack id.
 *                 example: arn:aws:cloudformation:us-east-1xxxstack/xxxx/b59bdac0-1cb2-11ed-9839-1247b67976eb
 *     responses:
 *       200:
 *         description: Returns a status of the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 StackStatus:
 *                   type: string
 *                   description: stack id
 *                   example: CREATE_COMPLETE
 *                 StackResources:
 *                   type: array
 *                   description: stack resources
 *                   items:
 *                     type: object
 *                     properties:
 *                       StackName:
 *                         type: string
 *                         description: stack the resource belongs to
 *                         example: environment-testEnv-user123-1661881669623
 *                       StackId:
 *                         type: string
 *                         description: The aws stack id.
 *                         example: arn:aws:cloudformation:us-east-1xxxstack/xxxx/b59bdac0-1cb2-11ed-9839-1247b67976eb
 *                       LogicalResourceId:
 *                         type: string
 *                         description: The aws Logical Resource Id.
 *                         example: testEnvuser123Ts16618816696230
 *                       PhysicalResourceId:
 *                         type: string
 *                         description: The aws Physical Resource Id.
 *                         example: i-0141f0a28108e3f93
 *                       ResourceType:
 *                         type: string
 *                         description: aws resource type.
 *                         example: AWS::EC2::Instance
 *                       ResourceStatus:
 *                         type: string
 *                         description: aws resource status.
 *                         example: CREATE_COMPLETE
 * 
 * 
 * 
 * 
 *                   
 */
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
        console.log("executing DescribeStacksCommand");

        const data = await req.awsClient.send(command);
        let resp: any = { ...data }
        console.log("checking Status");
        if (data.Stacks) {
            resp = { StackStatus: resp.Stacks[0].StackStatus, ...resp }
        }
        if (data.Stacks[0].StackStatus == "CREATE_COMPLETE") {
            const resParams: DescribeStackResourcesCommandInput = {
                StackName: `${stackId}`
            };
            const command = new DescribeStackResourcesCommand(resParams);
            console.log("executing DescribeStackResourcesCommand");
            const data = await req.awsClient.send(command);
            console.log("sending success Response DescribeStackResourcesCommand");
            return res.send({ ...resp, StackResources: data.StackResources });

        }
        res.send({ ...resp });
        // process data.
    } catch (error: any) {
        // error handling.
        if (error.$metadata) {
            const { requestId, cfId, extendedRequestId } = error.$metadata;
            console.log({ requestId, cfId, extendedRequestId });
        }
        console.log(error);
        res.status(500).send({ error: error.message })

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

/**
 * @openapi
 * /delete-env:
 *   post:
 *     description: Delete environments for playground secarios!
 *     responses:
 *       200:
 *         description: Returns a status of the request.
 */
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


export default router;
export const environmentController = router;
