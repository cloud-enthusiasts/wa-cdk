import {BlockPublicAccess, Bucket, BucketEncryption, BucketProps, IBucket} from "@aws-cdk/aws-s3";
import { v4 as uuid } from 'uuid';
import {Construct} from "@aws-cdk/core";

export interface WellArchitectedBucketProps extends BucketProps {

    /*
     * This property is used to enable or disable bucket security, defaults to true
     */
    readonly security?: boolean;

    /*
     * This property is used to enable to disable bucket monitoring, defaults to true
     *
     */
    readonly monitoring?: boolean;

    /*
     * If monitoring is enabled then logBucket name must be provided and it should already exist in the environment.
     */
    readonly logBucketArn?: string;

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
        });
    }

    private static generateRandomizedName(id: string): string {
        return `${uuid()}-${id.toLowerCase()}`
    }

    private static shouldEnableLogging(scope: Construct, props: WellArchitectedBucketProps): IBucket | undefined {
        if(WABucket.shouldMonitor(props)) {
            if(props.logBucketArn != undefined) {
                return Bucket.fromBucketArn(scope, "S3Logs", props.logBucketArn)
            } else {
                throw new Error("When monitoring is enabled, valid logBucketArn must be provided.")
            }
        } else {
            return undefined;
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
}