import { CloudFormationClient, DeleteStackCommand, DeleteStackCommandInput, ListStacksCommand, ListStacksCommandInput } from "@aws-sdk/client-cloudformation";

module.exports.handler = async function (event: any, context: any) {
    try {


        console.log("Received event:", event)
        let awsClient = new CloudFormationClient({
            "credentials": {
                accessKeyId: `${process.env.AWS_ID}`,
                secretAccessKey: `${process.env.AWS_SECRET}`
            },
            region: `${process.env.AWS_ENV_REGION}`
        });
        let params: ListStacksCommandInput = {
            StackStatusFilter: ['CREATE_COMPLETE']
        }
        let resp = await awsClient.send(new ListStacksCommand(params))
        let stacks = [...resp.StackSummaries]
        if (resp.NextToken)
            while (resp.NextToken) {
                params.NextToken = resp.NextToken
                resp = await awsClient.send(new ListStacksCommand(params))
                let stacks = [...resp.StackSummaries]
            }
        stacks = stacks.filter(st => st.StackName.startsWith("tc-user-env-"))
        // console.log(stacks);
        var ONE_HOUR = 60 * 60 * 1000; /* ms */
        stacks = stacks.filter(st => (Date.now() - st.CreationTime.getTime()) > ONE_HOUR)

        let reqPrms = stacks.map(async st => {
            const params: DeleteStackCommandInput = {
                StackName: `${st.StackId}`
            };
            const command = new DeleteStackCommand(params);
            // async/await.
            try {
                const data = await awsClient.send(command);
                return {
                    stackId: st.StackId,
                    status: 'success'
                }
            }
            catch (err) {
                console.log(err);
                return {
                    stackId: st.StackId,
                    status: 'failed',
                    err
                }
            }
        })
        return {
            statusCode: 200,
            body: JSON.stringify(await Promise.all(reqPrms))
        };
    }
    catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify(err)
        };
    }
};
