const AWS = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');


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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const s3 = new AWS.S3();

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
        console.log('Disabled Block Public Access settings');


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
        console.log('Bucket policy set for public read');

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

        const params = {
            Bucket: '11july2024',
            Key: `viewer/models/${req.file.originalname}`,
            Body: fileContent,
            ContentType: 'model/gltf-binary',
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


