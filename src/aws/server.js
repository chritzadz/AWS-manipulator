const express = require('express');
const cors = require('cors');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

app.post('/api/authenticate', async (req, res) => {
    const { accessKey, secretKey, region } = req.body;
    
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
        
        return res.json({ buckets: data.Buckets || [] });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid credentials or region' });
    }
    });

    // app.get('/api/buckets', async (req, res) => {
    // try {
    //     const s3 = new S3Client({
    //     region: process.env.AWS_REGION,
    //     credentials: {
    //         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //     },
    //     });

    //     const command = new ListBucketsCommand({});
    //     const data = await s3.send(command);
        
    //     return res.json({ buckets: data.Buckets || [] });
    // } catch (error) {
    //     console.error('Error listing buckets:', error);
    //     return res.status(500).json({ error: 'Failed to list buckets' });
    // }
// });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});