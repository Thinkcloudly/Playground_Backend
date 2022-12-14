var cors = require('cors')
const path = require('path')
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { urlencoded, json } from 'body-parser';
import { environmentController } from './controllers/environment.controller';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import serverless from 'serverless-http'
import { scenarioControllers } from './controllers/validations';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: false }))
// parse application/json
app.use(json())
// app.use(cors({
//   origin: '*'
// }))

app.use('/', (req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'content-type');
  next();
})

app.use('/api', (req: Request, res: Response, next) => {
  req.awsClient = new CloudFormationClient({
    "credentials": {
      accessKeyId: `${process.env.AWS_ID}`,
      secretAccessKey: `${process.env.AWS_SECRET}`
    },
    region: `${process.env.AWS_ENV_REGION}`
  });
  req.awsClient.config.logger = console;
  next()
});
app.use('/api', environmentController);
app.use('/api/validate-scenario', scenarioControllers);
app.use('/api/docs/', express.static(path.join(__dirname, '../www')))

module.exports = app;
module.exports.handler = serverless(app);

