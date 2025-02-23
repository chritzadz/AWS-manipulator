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
app.post('/.netlify/functions/upload', upload.single('file'), async (req, res) => {
    if (req.file) {
        const fileContent = fs.readFileSync(req.file.path);
        const bucketName = await getParameterValue("MODEL_S3_BUCKET");

        const params = {
            Bucket: bucketName,
            Key: `viewer/models/${req.file.originalname}`,
            Body: fileContent,
            ContentType: 'model/gltf-binary',
        };

        try {
            await s3.putObject(params).promise();
            fs.unlinkSync(req.file.path);

            const fileName = req.file.originalname.split('.')[0];
            const paramUpdateCSV = {
                Bucket: bucketName,
                Key: 'viewer/data.csv',
            };
            updateDataCSV(bucketName, paramUpdateCSV, fileName);

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