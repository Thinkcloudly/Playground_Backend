import { Router, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// setting up swaggger
const openapiSpecification = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ThinkCloudly Playground App',
            version: '1.0.0',
        },
        servers: [{ url: "/.netlify/functions/api" }],
    },
    apis: [
        "**/*.ts"
    ], // files containing annotations as above
});
swaggerUi.generateHTML(openapiSpecification)
let router = Router();
router.get('/swagger.json', (req, res) => res.json(openapiSpecification));
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openapiSpecification))
export default router;