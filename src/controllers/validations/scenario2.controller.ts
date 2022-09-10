import { DescribeStackResourcesCommand, DescribeStackResourcesCommandInput } from '@aws-sdk/client-cloudformation';
import express, { Router, Request, Response } from 'express';
import { DescribeVolumesCommand, DescribeVolumesCommandInput, EC2Client } from '@aws-sdk/client-ec2'
let router = Router();

router.post('/validate-scenario-2', async (req: Request, res: Response) => {
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
        console.log(data);

        let Resources: any[] = data.StackResources.map(element => {
            return {
                LogicalResourceId: element.LogicalResourceId,
                PhysicalResourceId: element.PhysicalResourceId,
                ResourceType: element.ResourceType,
                Timestamp: element.Timestamp,
                ResourceStatus: element.ResourceStatus,
            }
        })

        let ec2Id = Resources.find(x => x.ResourceType === "AWS::EC2::Instance")
        let ebsId = Resources.find(x => x.ResourceType === "AWS::EC2::Volume")

        let ec2Client = new EC2Client({
            "credentials": {
                accessKeyId: `${process.env.AWS_ID}`,
                secretAccessKey: `${process.env.AWS_SECRET}`
            },
            region: `${process.env.AWS_ENV_REGION}`
        });



        let scParams: DescribeVolumesCommandInput = {
            MaxResults: 100,
            Filters: [
                {
                    "Name": "attachment.instance-id",
                    "Values": [ec2Id.PhysicalResourceId]
                }
            ]
        }
        let scCmd = new DescribeVolumesCommand(scParams)
        let results = await ec2Client.send(scCmd);
        console.log(results);
        if (results.Volumes.find(x => x.VolumeId == ebsId.PhysicalResourceId)) {
            return res.send({
                status: "success",
                message: "scenario successfully completed"
            })
        }

        return res.send({
            status: "failed",
            message: "scenario not completed",
            results
        })
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
        res.status(500).send({ ...error })
    }
});
export default router;
export const scenario1Controller = router;
