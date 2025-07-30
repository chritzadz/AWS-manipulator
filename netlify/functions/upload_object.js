// netlify/functions/get_bucket.js
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const fs = require('fs');

exports.handler = async (event) => {
    const { putObjectParams } = JSON.parse(event.body);

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

        const command = new PutObjectCommand(putObjectParams);
        const data = await s3.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Upload object successfully' }),
        };
    } catch (error) {
        console.error('Upload object error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Upload object' }),
        };
    }
};