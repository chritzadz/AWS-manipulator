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

/*
ROUTE
*/
//validate credentials
app.post('/.netlify/functions/login', async (req, res) => {
    const {accessKey, secretKey} = req.body;

    if (!accessKey || !secretKey) {
        return res.status(400).json({ success: false, message: "Access and Secret keys are required" });
    }

    AWS.config.update({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: process.env.REGION
    });

    const s3 = new AWS.S3();
    
    s3.listBuckets((err, data) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Authentication failed" });
        } else {
            return res.json({ success: true, message: "Login successful!" });
        }
    });

});


const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};