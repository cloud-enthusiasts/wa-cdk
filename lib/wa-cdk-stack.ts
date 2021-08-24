import * as cdk from '@aws-cdk/core';
import {WABucket} from "./constructs/wa-s3/WABucket";

export class WaCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new WABucket(this, "MyBucket", {logBucketName: "arn:aws:s3:::cl-s3-logs"})
  }
}
