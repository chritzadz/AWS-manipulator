import express from "express";
import ServerlessHttp from "serverless-http";
import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const s3 = new AWS.S3();
const ssm = new AWS.SSM();

/*
HELPER FUNCTION
*/

const uploadViewer = async (bucketName) => {
    //create by order
    await createFolder(bucketName, 'viewer/');
    await createFolder(bucketName, 'viewer/background/');
    await createFolder(bucketName, 'viewer/models/');
    await uploadFile(bucketName, './viewer/data.csv', 'viewer/data.csv', 'text/csv');
    await uploadFile(bucketName, './viewer/index.html', 'index.html', 'text/html');
    await uploadFile(bucketName, './viewer/main.js', 'viewer/main.js', 'application/javascript');
    await uploadFile(bucketName, './viewer/style.css', 'viewer/style.css', 'text/css');
};

const createFolder = async (bucketName, folderPath, contentType) => {
    await s3.putObject({
        Bucket: bucketName,
        Key: folderPath,
        Body: ''
    }).promise();
}

const uploadFile = async (bucketName, filePath, s3key, contentType) => {
    const fileContent = fs.readFileSync(filePath);
    await s3.putObject({
        Bucket: bucketName,
        Key: s3key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'public-read'
    }).promise();
}

const getParameterValue = async (paramName) => {
    try {
        const params = {
            Name: paramName
        };

        const result = await ssm.getParameter(params).promise();

        console.log('Parameter value:', result.Parameter.Value);

        return result.Parameter.Value;
    } catch (error) {
        console.error('Error retrieving parameter:', error.message);
    }
};

const updateDataCSV = async (bucketName, param, fileName) => {
    const response = await s3.getObject(param).promise();
    const csvData = response.Body.toString('utf-8');
    let data = csvData.split('\n').map((row) => row.split(','));

    let existingRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === fileName) {
            existingRowIndex = i;
            break;
        }
    }

    if (existingRowIndex !== -1) {
        data[existingRowIndex][1] = encryptNumber(fileName);
    } else {
        // insert new row
        let scanIDHash = await encryptNumber(fileName);
        const newRow = [fileName, scanIDHash];
        data.splice(2, 0, newRow);
    }

    const updatedCsvData = data.map(row => row.join(',')).join('\n');

    const updateParams = {
        Bucket: bucketName,
        Key: 'viewer/data.csv',
        Body: updatedCsvData,
        ContentType: 'text/csv',
    };
    await s3.putObject(updateParams).promise();

    console.log('CSV file updated successfully');
};

const encryptNumber = async (number) => {
    const hexString = number.toString(16);
    const hash = crypto.createHash('sha256').update(hexString).digest('hex');
    return hash.slice(0, 12);
};

/*
ROUTE
*/
//create new s3
app.post('/.netlify/functions/createBucket', async (req, res) => {
    console.log("bucket_name: " + req.body.bucketName);
    const bucketName = req.body.bucketName;
    if (!bucketName) {
        return res.status(400).json({ error: 'Bucket name is required' });
    }

    const params = {
        Bucket: bucketName,
        CreateBucketConfiguration: {
            LocationConstraint: 'ap-southeast-2',
        }

    };

    try {
        await s3.createBucket(params).promise();
        console.log('Bucket created successfully:', bucketName);

        await s3.putPublicAccessBlock({
            Bucket: bucketName,
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                BlockPublicPolicy: false,
                IgnorePublicAcls: false,
                RestrictPublicBuckets: false
            }
        }).promise();

        const bucketPolicy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": `arn:aws:s3:::${bucketName}/*`
                }
            ]
        };
    
        await s3.putBucketPolicy({
            Bucket: bucketName,
            Policy: JSON.stringify(bucketPolicy)
        }).promise();

        const corsConfiguration = {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                    AllowedOrigins: ["*"],
                    ExposeHeaders: []
                }
            ]
        };

        await s3.putBucketCors({
            Bucket: bucketName,
            CORSConfiguration: corsConfiguration
        }).promise();

        const allowStaticHostingParams = {
            Bucket: bucketName,
            WebsiteConfiguration: {
                IndexDocument: { Suffix: 'index.html' }
            }
        };
        await s3.putBucketWebsite(allowStaticHostingParams).promise();

        const deforceOwnership = {
            Bucket: bucketName,
            OwnershipControls: {
                Rules: [
                    {
                    ObjectOwnership: 'BucketOwnerPreferred' // or 'ObjectOwnerPreferred'
                    }
                ]
            }
        };
        await s3.putBucketOwnershipControls(deforceOwnership).promise();

        //upload viewer template
        uploadViewer(bucketName);

        return res.status(200).json({ message: 'Bucket created with policy and CORS configuration' });
    } catch (error) {
        console.error('Error creating bucket:', error);
        return res.status(500).json({ message: 'Error creating bucket' });;
    }
});

const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};