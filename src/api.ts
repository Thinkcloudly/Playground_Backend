var cors = require('cors')
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { urlencoded, json } from 'body-parser';
import { environmentController } from './controllers/environment.controller';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import serverless from 'serverless-http'

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: false }))
// parse application/json
app.use(json())
app.use(cors({
  origin: '*'
}))




app.use('./', (req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
})
app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// setting up swaggger
const openapiSpecification = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ThinkCloudly Playground App',
      version: '1.0.0',
    },
  },
  apis: ['./controllers/*.js'], // files containing annotations as above
});

app.use('/.netlify/functions/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

app.use('/.netlify/functions/api', (req: Request, res: Response, next) => {
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
app.use('/.netlify/functions/api', environmentController);


module.exports = app;
module.exports.handler = serverless(app);