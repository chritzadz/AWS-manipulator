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

const s3 = new AWS.S3();
const ssm = new AWS.SSM();

/*
HELPER FUNCTION
*/


/*
ROUTE
*/
// get list of existing bucket
app.get('/.netlify/functions/getBucketList', (req, res) => {
    s3.listBuckets((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const bucketList = data.Buckets.map(bucket => bucket.Name);
        return res.json(bucketList);
    });
});

const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};