const AWS = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = 5500;

app.use(cors());
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: process.env.REGION
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file
    }
});

const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const s3 = new AWS.S3();
const ssm = new AWS.SSM();

//help methods
const uploadViewer = async (bucketName) => {
    //create by order
    await createFolder(bucketName, 'viewer/');
    await createFolder(bucketName, 'viewer/background/');
    await createFolder(bucketName, 'viewer/models/');
    await uploadFile(bucketName, './viewer/data.csv', 'viewer/data.csv');
    await uploadFile(bucketName, './viewer/index.html', 'viewer/index.html');
    await uploadFile(bucketName, './viewer/main.js', 'viewer/main.js');
    await uploadFile(bucketName, './viewer/style.css', 'viewer/style.css');
};

const createFolder = async (bucketName, folderPath) => {
    await s3.putObject({
        Bucket: bucketName,
        Key: folderPath,
        Body: ''
    }).promise();
}

const uploadFile = async (bucketName, filePath, s3key) => {
    const fileContent = fs.readFileSync(filePath);
    await s3.putObject({
        Bucket: bucketName,
        Key: s3key,
        Body: fileContent
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
        // inser new row
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// get list of existing bucket
app.get('/getBucketList', (req, res) => {
    s3.listBuckets((err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const bucketList = data.Buckets.map(bucket => bucket.Name);
        res.json(bucketList);
    });
});

//create new s3
app.post('/createBucket', async (req, res) => {
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

        //upload viewer template
        uploadViewer(bucketName);

        res.status(200).json({ message: 'Bucket created with policy and CORS configuration' });
    } catch (error) {
        console.error('Error creating bucket:', error);
        res.status(500).json({ message: 'Error creating bucket' });;
    }
});


// .glb file endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
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

            res.json({ message: 'File uploaded successfully!', file: req.file });
        } catch (error) {
            console.error('Error uploading to S3:', error);
            res.status(500).json({ message: 'Error uploading to S3.' });
        }
    } else {
        res.status(400).json({ message: 'File upload failed.' });
    }
});

//change param so lambda can work
app.post('/changeWorkingBucketParam', async (req, res) => {
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

        res.status(200).json({ message: 'Bucket parameter successfully change' });
    } catch (error) {
        console.error('Error updating parameter:', error.message);

        res.status(500).json({ message: 'Bucket parameter unsuccessful change' });
    }
});

//change bg of html
app.post('/uploadBackground', upload.single('file'), async (req, res) => {
    if (req.file) {
        const fileContent = fs.readFileSync(req.file.path);
        const bucketName = getParameterValue("MODEL_S3_BUCKET");

        const params = {
            Bucket: bucketName,
            Key: `viewer/background/${req.file.originalname}`,
            Body: fileContent,
            ContentType: 'image/jpeg',
        };

        try {
            await s3.putObject(params).promise();
            fs.unlinkSync(req.file.path);
            res.json({ message: 'File uploaded successfully!', file: req.file });
        } catch (error) {
            console.error('Error uploading to S3:', error);
            res.status(500).json({ message: 'Error uploading to S3.' });
        }
    } else {
        res.status(400).json({ message: 'File upload failed.' });
    }
});


