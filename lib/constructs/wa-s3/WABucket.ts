import {BlockPublicAccess, Bucket, BucketEncryption, BucketProps, IBucket, BucketMetrics} from "@aws-cdk/aws-s3";
import { v4 as uuid } from 'uuid';
import {Construct, Duration, Tag, Tags} from "@aws-cdk/core";
import {Alarm, ComparisonOperator, Metric} from "@aws-cdk/aws-cloudwatch";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";
import {Topic} from "@aws-cdk/aws-sns";

export interface WellArchitectedBucketProps extends BucketProps {

    /**
     * This property is used to enable or disable bucket security, defaults to true
     */
    readonly security?: boolean;

    /**
     * This property is used to enable to disable bucket monitoring, defaults to true
     *
     */
    readonly monitoring?: boolean;

    /**
     * If monitoring is enabled then logBucket name must be provided and it should already exist in the environment.
     */
    readonly logBucketName?: string;

    /**
     * If monitoring is enable then SNS topic for alarms must be provided.
     */
    readonly snsTopicArn?: string;

    /**
     * If backup is enabled objects will be versioned.
     */
    readonly backup?: boolean;

}

/*
 *  Well Architected S3 Bucket
 */
export class WABucket extends Bucket {

    constructor(scope: Construct, id: string, props: WellArchitectedBucketProps) {

        super(scope, id, {
            ...props,
            bucketName: WABucket.getValueOrDefault(props.bucketName, WABucket.generateRandomizedName(id)),
            encryption: WABucket.shouldEncryptAtRest(props),
            enforceSSL: WABucket.shouldEncryptInTransit(props),
            blockPublicAccess: WABucket.shouldBlockPublicAccess(props),
            serverAccessLogsBucket: WABucket.shouldEnableLogging(scope, props),
            metrics: WABucket.shouldEnableMetrics(id, props),
            versioned: WABucket.shouldBackup(props)
        });

        if (WABucket.shouldMonitor(props)) {
            this.create4xxErrorsAlarm(props.snsTopicArn);
            this.create5xxErrorsAlarm(props.snsTopicArn);
        }
    }

    private static generateRandomizedName(id: string): string {
        return `${uuid()}-${id.toLowerCase()}`
    }

    private static shouldEnableLogging(scope: Construct, props: WellArchitectedBucketProps): IBucket | undefined {
        if(WABucket.shouldMonitor(props)) {
            if(props.logBucketName != undefined) {
                return Bucket.fromBucketArn(scope, "S3Logs", `arn:aws:s3:::${props.logBucketName}`)
            } else {
                throw new Error("When monitoring is enabled, valid logBucketName must be provided.")
            }
        } else {
            return undefined;
        }
    }

    private static shouldEnableMetrics(id: string, props: WellArchitectedBucketProps): BucketMetrics[] | undefined  {
        if(WABucket.shouldMonitor(props)) {
            return [{id: `${id}-ReqMetrics`} as BucketMetrics]
        } else {
            return undefined
        }
    }

    private static shouldEncryptAtRest(props: WellArchitectedBucketProps): BucketEncryption {
        if(WABucket.shouldSecure(props)) {
            return WABucket.getValueOrDefault(props.encryption, BucketEncryption.S3_MANAGED);
        } else {
            return BucketEncryption.UNENCRYPTED;
        }
    }

    private static shouldEncryptInTransit(props: WellArchitectedBucketProps): boolean {
        if(WABucket.shouldSecure(props)) {
            return WABucket.getValueOrDefault(props.enforceSSL, true);
        } else {
            return false;
        }
    }

    private static shouldSecure(props: WellArchitectedBucketProps) {
        return WABucket.getValueOrDefault(props.security, true)
    }

    private static shouldMonitor(props: WellArchitectedBucketProps) {
        return WABucket.getValueOrDefault(props.monitoring, true)
    }

    private static shouldBackup(props: WellArchitectedBucketProps) {
        return WABucket.getValueOrDefault(props.backup, true)
    }

    private static shouldBlockPublicAccess(props: WellArchitectedBucketProps): BlockPublicAccess {
        if(WABucket.shouldSecure(props)) {
            return WABucket.getValueOrDefault(props.blockPublicAccess, BlockPublicAccess.BLOCK_ALL);
        } else {
            return BlockPublicAccess.BLOCK_ALL;
        }
    }

    private static getValueOrDefault<T>(propertyValue: T | undefined, defaultValue: T): T {
        if( propertyValue != null || propertyValue != undefined)
            return propertyValue;
        else {
            return defaultValue;
        }
    }


    private create4xxErrorsAlarm(snsTopicArn?: string): Alarm {
        const error4xxMetric = new Metric({
            namespace: "AWS/S3",
            metricName: "4xxErrors",
            statistic: "Sum",
            period: Duration.minutes(5)
        });

        const alarm = new Alarm(this, "S34xxErrorAlarm", {
            alarmName: `${this.bucketName}-S34xxErrorAlarm`,
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            metric: error4xxMetric,
            alarmDescription: "S3 4xxError Rate Alarm",
            threshold: 1,
            evaluationPeriods: 5
        })
        if(snsTopicArn)
            alarm.addAlarmAction(new SnsAction(Topic.fromTopicArn(this, "4xxErrorsAlarmAction", snsTopicArn)))

        return alarm;
    }

    private create5xxErrorsAlarm(snsTopicArn?: string): Alarm {
        const error5xxMetric = new Metric({
            namespace: "AWS/S3",
            metricName: "5xxErrors",
            statistic: "Sum",
            period: Duration.minutes(5)
        });

        const alarm = new Alarm(this, "S35xxErrorAlarm", {
            alarmName: `${this.bucketName}-S35xxErrorAlarm`,
            comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
            metric: error5xxMetric,
            alarmDescription: "S3 5xxError Rate Alarm",
            threshold: 1,
            evaluationPeriods: 5
        })

        if(snsTopicArn)
            alarm.addAlarmAction(new SnsAction(Topic.fromTopicArn(this, "5xxErrorsAlarmAction", snsTopicArn)))
        return alarm;
    }
}