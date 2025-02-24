import express from "express";
import ServerlessHttp from "serverless-http";
import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const SECRET_JWT_KEY = process.env.JWT_SECRET;

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
app.post('/.netlify/functions/login', verifyToken, async (req, res) => {
    const { accessKey, secretKey } = req.body;

    if (!accessKey || !secretKey) {
        return res.status(400).json({ success: false, message: "Access and Secret keys are required" });
    }

    if (accessKey !== process.env.ACCESS_KEY || secretKey !== process.env.SECRET_KEY) {
        return res.status(403).json({ success: false, message: "Authentication failed" });
    }

    const token = jwt.sign({ accessKey }, SECRET_JWT_KEY, { expiresIn: '1h' });

    return res.json({ success: true, message: "Login successful!", token });
});


const handler = ServerlessHttp(app);
module.exports.handler = async(event, context) => {
    const result = await handler(event, context);
    return result;
};