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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage ,
    limits: { fileSize: 50 * 1024 * 1024 }
});


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

/*
ROUTE
*/
//change bg of html
app.post('/.netlify/functions/uploadBackground', upload.single('file'), async (req, res) => {
    if (req.file) {
        const fileContent = fs.readFileSync(req.file.path);
        const bucketName = await getParameterValue("MODEL_S3_BUCKET");

        const params = {
            Bucket: bucketName,
            Key: `viewer/background/cyberport.jpg`,
            Body: fileContent,
            ContentType: 'image/jpeg',
        };

        try {
            await s3.putObject(params).promise();
            fs.unlinkSync(req.file.path);
            return res.json({ message: 'File uploaded successfully!', file: req.file });
        } catch (error) {
            console.error('Error uploading to S3:', error);
            res.status(500).json({ message: 'Error uploading to S3.' });
            return res.json({ message: 'Error uploading to S3.' });
        }
    } else {
        res.status(400).json({ message: 'File upload failed.' });
        return res.json({ message: 'File upload failed.' });
    }
});


const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};