// netlify/functions/authenticate.js
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    const { accessKey, secretKey, region } = JSON.parse(event.body);
    const secret = "ubivox"
    
    if (!accessKey || !secretKey || !region) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required credentials' }),
        };
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
        
        const token = jwt.sign({ accessKey, region }, secret, { expiresIn: '1h' });
        
        return {
            statusCode: 200,
            body: JSON.stringify({ buckets: data.Buckets || [], token: token }),
        };
        
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid credentials or region' }),
        };
    }
};