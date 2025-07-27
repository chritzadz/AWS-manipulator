// netlify/functions/delete_bucket.js
const { S3Client, DeleteBucketCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    const { bucketParams } = JSON.parse(event.body);

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

        const command = new DeleteBucketCommand(bucketParams);
        await s3.send(command);

        const commandGetBucket = new ListBucketsCommand({});
        const newBucketList = await s3.send(commandGetBucket);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Bucket deleted successfully', buckets: newBucketList.Buckets }),
        };
    } catch (error) {
        console.error('Bucket deletion error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Bucket not deleted' }),
        };
    }
};