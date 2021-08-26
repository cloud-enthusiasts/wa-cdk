import * as cdk from '@aws-cdk/core';
import {WABucket} from "./constructs/wa-s3/WABucket";
import {Topic} from "@aws-cdk/aws-sns";

export class WaCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const snsNotificationTopic = new Topic(this, 'SNSNotificationTopic', {
      displayName: 'CloudWatch Alarm Notification Topic',
      topicName: 'SNSCloudWatchErrorNotificationTopic',
    });


    new WABucket(this, "MyBucket", {
      logBucketName: "cl-s3-logs",
      snsTopicArn: snsNotificationTopic.topicArn
    });
  }
}
