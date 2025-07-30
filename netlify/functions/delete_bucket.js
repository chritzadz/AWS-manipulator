// netlify/functions/delete_bucket.js
const { S3Client, DeleteBucketCommand, ListBucketsCommand, ListObjectsV2Command, DeleteObjectsCommand} = require('@aws-sdk/client-s3');
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

        //before delete, delete all objects
        const listCommand = new ListObjectsV2Command({ Bucket: bucketParams.Bucket });
        const listedObjects = await s3.send(listCommand);
        const objectsToDelete = listedObjects.Contents.map(object => ({ Key: object.Key }));

        if (listedObjects.Contents.length === 0) {
            //do nothing shoudl fix this with the condition tho.
        }
        else{
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: bucketParams.Bucket,
                Delete: { Objects: objectsToDelete }
            });
            await s3.send(deleteCommand);
        }

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