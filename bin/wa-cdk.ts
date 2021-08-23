#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { WaCdkStack } from '../lib/wa-cdk-stack';
import {WABucket} from "../lib/constructs/wa-s3/WABucket";

const app = new cdk.App();
new WaCdkStack(app, 'WaCdkStack', {});
