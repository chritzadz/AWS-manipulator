// netlify/functions/create_bucket.js
const { S3Client, CreateBucketCommand, ListBucketsCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');

uploadFile = async (file, key, bucketName, s3) => {
    let command = null

    if (file != null){
        command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: file,
        });
    }
    else{
        command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
    }

    console.log(bucketName, key, file == null)
    await s3.send(command);
}

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

        const command = new CreateBucketCommand(bucketParams);
        await s3.send(command);

        const commandGetBucket = new ListBucketsCommand({});
        const newBucketList = await s3.send(commandGetBucket);

        await uploadFile(await fs.readFile("src/assets/bucket_template/index.html"), "index.html", bucketParams.Bucket, s3);
        await uploadFile(await fs.readFile("src/assets/bucket_template/viewer/index.html"), "viewer/index.html", bucketParams.Bucket, s3);
        await uploadFile(await fs.readFile("src/assets/bucket_template/viewer/data.csv"), "viewer/data.csv", bucketParams.Bucket, s3);
        await uploadFile(await fs.readFile("src/assets/bucket_template/viewer/main.js"), "viewer/main.js", bucketParams.Bucket, s3);
        await uploadFile(await fs.readFile("src/assets/bucket_template/viewer/style.css"), "viewer/style.css", bucketParams.Bucket, s3);
        await uploadFile(null, "viewer/background/" , bucketParams.Bucket, s3);
        await uploadFile(null, "viewer/models/", bucketParams.Bucket, s3);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Bucket created successfully', buckets: newBucketList.Buckets }),
        };
    } catch (error) {
        console.error('Bucket creation error:', error);
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Bucket not created' }),
        };
    }
};