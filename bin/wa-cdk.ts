#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { WaCdkStack } from '../lib/wa-cdk-stack';
import {WABucket} from "../lib/constructs/wa-s3/WABucket";
import {CfnParameter, TagManager, Tags, TagType} from "@aws-cdk/core";

const app = new cdk.App();

const stack = new WaCdkStack(app, 'WaCdkStack', {});

const project = new CfnParameter(stack, 'Project', {
    type: 'String',
    default: "Sample",
});

const environment = new CfnParameter(stack, 'Environment', {
    type: 'String',
    default: "Development",
});

// Tags.of(stack).add(project.logicalId, project.valueAsString)
// Tags.of(stack).add(environment.logicalId, environment.valueAsString)
