import {App, Stack} from "@aws-cdk/core";
import {WABucket} from "../lib/constructs/wa-s3/WABucket";
import {expect as cdkExpect, haveResource, SynthUtils} from "@aws-cdk/assert";

let app: App;
let stack: Stack;

describe("Well Architected Bucket Properties Tests", () => {

    beforeEach(() => {
        app = new App();
        stack = new Stack(app, "Test-Stack", {});
    });

    test("Bucket should be secure by default", () => {
        new WABucket(stack, "MyTestBucket", {
            bucketName: "mytestbucket",
            monitoring: false
        });

        cdkExpect(stack).to(haveResource("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": true,
                "BlockPublicPolicy": true,
                "IgnorePublicAcls": true,
                "RestrictPublicBuckets": true,
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [{
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256",
                        }
                    }]
            }
        }));

        cdkExpect(stack).to(haveResource("AWS::S3::BucketPolicy", {
            "PolicyDocument":  {
            "Statement":  [
                 {
                "Action": "s3:*",
                    "Condition":  {
                    "Bool":  {
                        "aws:SecureTransport": "false",
                    },
                },
                "Effect": "Deny",
                    "Principal":  {
                    "AWS": "*",
                },
                "Resource":  [
                     {
                    "Fn::GetAtt":  [
                        "MyTestBucket81062429",
                            "Arn",
                        ],
                },
                 {
                    "Fn::Join":  [
                        "",
                             [
                                 {
                        "Fn::GetAtt":  [
                            "MyTestBucket81062429",
                                "Arn",
                            ],
                    },
                    "/*",
                ],
                ],
                },
            ],
            },
        ],
            "Version": "2012-10-17",
        }
        }));
        expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });

    it("should enable monitoring by default", () => {
        new WABucket(stack, "MyTestBucket", {
            bucketName: "mytestbucket",
            logBucketArn: "arn:aws:s3:::mytestlogbucket"
        });

        cdkExpect(stack).to(haveResource("AWS::S3::Bucket", {
            "LoggingConfiguration": {
                "DestinationBucketName": "mytestlogbucket",
            }
        }));

        expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });

    it("should allow monitoring to be turned off", () => {
        new WABucket(stack, "MyTestBucket", {
            bucketName: "mytestbucket",
            monitoring: false
        });

        expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
    });

})
