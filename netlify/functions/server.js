const express = require('express');
const session = require('express-session');
const cors = require('cors');
const serverless = require('serverless-http');
const { S3Client, ListBucketsCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());
const router = Router();

const corsOptions = {
    origin: true,
    credentials: true
};

app.use(cors(corsOptions));

app.use(session({
    secret: 'ubivox', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000 * 60,
        secure: false
    }
}));


app.post('/authenticate', async (req, res) => {
    const { accessKey, secretKey, region } = req.body;

    console.log(req.session.id)
    
    if (!accessKey || !secretKey || !region) {
        return res.status(400).json({ error: 'Missing required credentials' });
    }

    try {
        const s3 = new S3Client({
        region,
        credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        },
        });

        const command = new ListBucketsCommand({});
        const data = await s3.send(command);
        
        req.session.accessKey = accessKey
        req.session.secretKey = secretKey
        req.session.region = region
            
        return res.json({ buckets: data.Buckets || [] });
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid credentials or region' });
    }
});

app.post('/create_bucket', async (req, res) => {
    const { bucketParams } = req.body;

    console.log('Session Credentials:', req.session.id);

    try {
        const s3 = new S3Client({
            region: req.session.region,
            credentials: {
                accessKeyId: req.session.accessKey,
                secretAccessKey: req.session.secretKey,
            },
        });

        const command = new CreateBucketCommand(bucketParams);
        const data = await s3.send(command);

        const commandGetBucket = new ListBucketsCommand({});
        const newBucketList = await s3.send(commandGetBucket);

        return res.json({ message: 'Bucket created successfully', buckets: newBucketList.Buckets });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Bucket not created' });
    }
});

app.use("/api/", router)
export const handler = serverless(app)