import express from "express";
import ServerlessHttp from "serverless-http";
import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import { verifyToken } from './auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const index_file = fs.readFileSync(path.join(__dirname, 'viewer/data.csv'));
const javascript_file = fs.readFileSync(path.join(__dirname, 'viewer/index.html'));
const css_file = fs.readFileSync(path.join(__dirname, 'viewer/main.js'));
const data_file =fs.readFileSync(path.join(__dirname, 'viewer/style.css'));

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
    await uploadFile(bucketName, data_file, 'viewer/data.csv', 'text/csv');
    await uploadFile(bucketName, index_file, 'index.html', 'text/html');
    await uploadFile(bucketName, javascript_file, 'viewer/main.js', 'application/javascript');
    await uploadFile(bucketName, css_file, 'viewer/style.css', 'text/css');
};

const createFolder = async (bucketName, folderPath) => {
    await s3.putObject({
        Bucket: bucketName,
        Key: folderPath,
        Body: ''
    }).promise();
}

const uploadFile = async (bucketName, fileContent, s3key, contentType) => {
    await s3.putObject({
        Bucket: bucketName,
        Key: s3key,
        Body: fileContent,
        ContentType: contentType,
        ACL: 'public-read'
    }).promise();
}


/*
ROUTE
*/
//create new s3
app.post('/.netlify/functions/createBucket', verifyToken, async (req, res) => {
    console.log("bucket_name: " + req.body.bucketName);
    const bucketName = req.body.bucketName;
    if (!bucketName) {
        return res.status(400).json({ error: 'Bucket name is required' });
    }

    const params = {
        Bucket: bucketName,
        CreateBucketConfiguration: {
            LocationConstraint: process.env.REGION,
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
                    "Action": ["s3:GetObject", "s3:PutObject"],
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
        await uploadViewer(bucketName);
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