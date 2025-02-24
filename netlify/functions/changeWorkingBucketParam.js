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

const s3 = new AWS.S3();
const ssm = new AWS.SSM();

/*
HELPER FUNCTION
*/

/*
ROUTE
*/
// get list of existing bucket
app.post('/.netlify/functions/changeWorkingBucketParam', verifyToken, async (req, res) => {
    const paramName = req.body.paramName;
    const bucketName = req.body.bucketName;
    try {
        const params = {
            Name: paramName,
            Value: bucketName,
            Type: 'String',
            Overwrite: true
        };
        const result = await ssm.putParameter(params).promise();
        console.log(`Parameter ${paramName} updated successfully`, result);

        return res.status(200).json({ message: 'Bucket parameter successfully change' });
    } catch (error) {
        console.error('Error updating parameter:', error.message);

        return res.status(500).json({ message: 'Bucket parameter unsuccessful change' });
    }
});

const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};