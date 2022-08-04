import { DescribeStackResourcesCommand, DescribeStackResourcesCommandInput } from '@aws-sdk/client-cloudformation';
import express, { Router, Request, Response } from 'express';

let router = Router();

router.post('/validate-scenario-1', async (req: Request, res: Response) => {
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
        // data.StackResources.forEach(element => {
        //     console.log(element.LogicalResourceId);

        // });

        res.send({ ...data });
        // process data.
    } catch (error: any) {
        // error handling.
        console.log(error);
        /**
         * The keys within exceptions are also parsed.
         * You can access them by specifying exception names:
         * if (error.name === 'SomeServiceException') {
         * 
         **/
    }
});
export default router;
export const scenario1Controller = router;
