var cors = require('cors')
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { urlencoded, json } from 'body-parser';
import { environmentController } from './controllers/environment.controller';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import serverless from 'serverless-http'

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: false }))
// parse application/json
app.use(json())

app.use('./', (req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
})
app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use('/.netlify/functions/api', (req: Request, res: Response, next) => {
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
app.use('/.netlify/functions/api', environmentController);


module.exports = app;
module.exports.handler = serverless(app);