import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { urlencoded, json } from 'body-parser';
import { environmentController } from './controllers/environment.controller';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: false }))

// parse application/json
app.use(json())


app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use('/api', (req: Request, res: Response, next) => {
  req.awsClient = new CloudFormationClient({
    "credentials": {
      accessKeyId: `${process.env.AWS_ID}`,
      secretAccessKey: `${process.env.AWS_SECRET}`
    },
    region: `${process.env.AWS_REGION}`
  });
  req.awsClient.config.logger = console;
  next()
});
app.use('/api', environmentController);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});