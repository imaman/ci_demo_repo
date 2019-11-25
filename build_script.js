const { spawn } = require('child_process');
const AWS = require('aws-sdk')

var stepfunctions = new AWS.StepFunctions();

function extractToken(processArgv) {
    const taskToken = '--step-function-task-token'
    const args = processArgv.slice(2)
    const index = args.indexOf(taskToken)
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

console.log('args=' + JSON.stringify(process.argv))
const taskToken = extractToken(process.argv)
console.log('stepfunction token=' + taskToken)

new Promise((resolve, reject) => {    
    const child = spawn('npm', ['run', 'test']);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);    

    child.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
      if (code === 0) {
          resolve()
      } else {
          reject(`Exit code=${code}`)
      }
    }); 
}).then(() => {
    const params = {
        output: '"-OK-"',
        taskToken
    };
    stepfunctions.sendTaskSuccess(params).promise()
})
