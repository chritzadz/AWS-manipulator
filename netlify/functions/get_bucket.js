// netlify/functions/get_bucket.js
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    try {
        const token = event.headers.authorization?.split(' ')[1];
        
        const secret = 'ubivox';
        const decoded = jwt.verify(token, secret);

        const s3 = new S3Client({
            region: decoded.region,
            credentials: {
                accessKeyId: decoded.accessKey,
                secretAccessKey: decoded.secretKey,
            },
        });

        const command = new ListBucketsCommand({});
        const data = await s3.send(command);

        const tempArray = [];
        for (let i = 0; i < data.Buckets.length; i++) {
            const element = data.Buckets[i];
            tempArray.push({
                name: element.Name
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Get bucket successfully', buckets: tempArray }),
        };
    } catch (error) {
        console.error('Get bucket error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Get bucker' }),
        };
    }
};