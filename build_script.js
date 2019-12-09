const { spawn } = require('child_process');
const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const glob = require("glob")

var stepfunctions = new AWS.StepFunctions();

const args = process.argv.slice(2)

function extractFlag(flag) {
  const index = args.indexOf(flag)
  if (index < 0) {
    throw new Error(`Missing flag: ${flag}`)
  }

  if (index == args.length - 1) {
    throw new Error(`Flag ${flag} was used without a value`)
  }

  const token = String(args[index + 1]).trim()
  if (!token.length) {
    throw new Error(`Flag ${flag} must pass a non-empty value`)
  }

  return token
}


const taskToken = extractFlag('--step-function-task-token')
const s3Bucket = extractFlag('--s3Bucket')
const s3Prefix = extractFlag('--s3Prefix')
const shardId = Number(extractFlag('--shardId'))
const numShards = Number(extractFlag('--numShards'))

if (!Number.isInteger(numShards) || numShards <= 0) {
  throw new Error(`--numShards must be a positive integer (was ${numShards})`)
}

if (!Number.isInteger(shardId) || shardId < 0 || shardId >= numShards) {
  throw new Error(`--shardId must be an integer in the range [0, ${numShards}) (was ${shardId})`)
}
const s3 = new AWS.S3()

const LIMIT = 1000 * 1000 // 1 MB

async function upload(fileToUpload) {
  let str = fs.readFileSync(fileToUpload, 'utf-8')
  if (str.length > LIMIT) {
    str = str.substring(0, LIMIT)
  }

  const key = s3Prefix + path.extname(fileToUpload)
  return s3.putObject({ Bucket: s3Bucket, Key: key, Body: str }).promise()
}

new Promise((resolve, reject) => {
  const files = glob.sync("test/**/*.js")
  console.log('files=' + JSON.stringify(files))
  files.sort((lhs, rhs) => lhs.localeCompare(rhs))
  const buckets = []
  for (let i = 0; i < numShards; ++i) {
    buckets.push([])
  }

  for (let i = 0; i < files.length; ++i) {
    buckets[i % buckets.length].push(files[i])
  }

  const argsToNpm = ['run', 'test', '--']
  buckets[shardId].forEach(curr => argsToNpm.push(curr))
  const child = spawn('npm', argsToNpm);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on('exit', async (code) => {
    console.log(`child process exited with code ${code}`);
    await Promise.all([upload('/tmp/wix_build_machine.log'), upload('/tmp/wix_build_machine.json')])
    if (code === 0) {
      resolve()
    } else {
      reject(`Exit code=${code}`)
    }
  });
}).then(() => {
  const params = {
    output: JSON.stringify({ status: "-OK-" }),
    taskToken
  };
  stepfunctions.sendTaskSuccess(params).promise()
}).catch(err => {
  const params = {
    output: JSON.stringify({ status: "-FAILED-", casuse: err }),
    taskToken
  };
  stepfunctions.sendTaskSuccess(params).promise()
})
