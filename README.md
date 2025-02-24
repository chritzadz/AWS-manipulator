# AWS-manipulator
This project serves as a web-interface in interacting with aws (through aws-sdk). Although, it is specifically a project to generate a 3d object model through a website. the feature include:
1. Creating an S3 bucket
2. Upload background to displayed in web
3. Upload model to displayed in web

The program is configured to be deploy through netlify

# Set up
## Deploying in netlify
1. fork the project to your own remote repository
2. connect to netlify and connect project to netlify (refer to: https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/)
3. website is available for use


## Running locally (via Express app)
1. deploy a node project
2. in terminal, node local_api.js

# Requirement
1. AWS account with IAM role (with administrator access), and generate secret key and access key


# Reference
- https://www.youtube.com/watch?v=_DRklnnJbig&t=541s
