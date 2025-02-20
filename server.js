const AWS = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5500;

require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
    region: 'ap-southeast-2'
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const s3 = new AWS.S3();

// .glb file endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (req.file) {
        const fileContent = fs.readFileSync(req.file.path);

        const params = {
            Bucket: '11july2024',
            Key: req.file.originalname,
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


