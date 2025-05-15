// cron.js
const cron = require('node-cron');
const { exec } = require('child_process'); // <-- Use the standard child_process module

// Helper function to wrap the callback-based exec in a Promise
function execPromise(command) {
    return new Promise((resolve, reject) => {
        // exec(command, options, callback)
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // If there's an error, reject the promise
                // Include stdout and stderr in the error object for better debugging
                error.stdout = stdout;
                error.stderr = stderr;
                return reject(error);
            }
            // If successful, resolve the promise with stdout and stderr
            resolve({ stdout, stderr });
        });
    });
}

// This function contains the task you want to schedule
async function runMainAutomation() {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] Triggering main automation script...`);

    try {
        // Use the promise wrapper for the exec call
        const { stdout, stderr } = await execPromise('node main.js');

        // Log stdout and stderr if the command succeeded
        if (stdout) {
            console.log('[main.js stdout]:\n', stdout);
        }
        if (stderr) {
            // stderr might contain warnings even if error is null, so log it separately
            console.error('[main.js stderr]:\n', stderr);
        }
        console.log(`[${timestamp}] Main automation script finished successfully.`);

    } catch (error) {
        // This catch block handles rejection from execPromise (e.g., command failed, non-zero exit code)
        console.error(`[${timestamp}] ❌ Error running main.js:`, error.message);
        // Log the captured stdout/stderr if available in the error object from execPromise
        if (error.stdout) console.log('[main.js stdout on error]:\n', error.stdout);
        if (error.stderr) console.error('[main.js stderr on error]:\n', error.stderr);
    }
    console.log(`[${timestamp}] Scheduled task complete.`);
}

// Define the cron schedule for "every 2 minutes"
// The syntax is:
// * * * * *
// | | | | |
// | | | | ----- day of week (0 - 7) (Sunday=0 or 7)
// | | | ------- month (1 - 12)
// | | --------- day of month (1 - 31)
// | ----------- hour (0 - 23)
// ------------- minute (0 - 59)

// */2 in the minute position means "every 2 minutes"
const schedule = '*/2 * * * *';

console.log(`Starting scheduler to run main.js every 2 minutes (${schedule})...`);

// Schedule the function to run according to the schedule
cron.schedule(schedule, () => {
    // We call the async function and catch any unhandled errors within the cron task runner
    runMainAutomation().catch(err => console.error(`[${new Date().toLocaleString()}] 💥 Unhandled error during task execution:`, err));
});

console.log('Scheduler started. Keep this script running in the background.');

// To keep this script running reliably in the background, you would typically
// use a tool like PM2 (https://pm2.keymetrics.io/docs/latest/quick-start/).
// Example: pm2 start cron.js --name my-twitter-bot-scheduler