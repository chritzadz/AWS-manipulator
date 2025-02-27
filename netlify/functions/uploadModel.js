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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });


/*
HELPER FUNCTION
*/

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
app.post('/.netlify/functions/uploadModel', upload.single('file'), verifyToken, async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            return res.status(400).json({ message: "Missing fileName or fileType" });
        }

        const bucketName = await getParameterValue("MODEL_S3_BUCKET");

        const params = {
            Bucket: bucketName,
            Key: `viewer/models/${fileName}`,
            ContentType: fileType,
            Expires: 300
        };

        const uploadURL = await s3.getSignedUrlPromise("putObject", params);

        const paramUpdateCSV = {
            Bucket: bucketName,
            Key: 'viewer/data.csv',
        };
        await updateDataCSV(bucketName, paramUpdateCSV, fileName.split('.')[0]);
        return res.json({ uploadURL });

    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        return res.status(500).json({ message: "Failed to generate pre-signed URL" });
    }
});

const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};