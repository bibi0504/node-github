const process = require('process');
const { exec } = require('child_process');
const util = require('util');
const { existsSync } = require('fs');
const execAsync = util.promisify(exec);
const { parse, addDays, addYears, isWeekend, setHours, setMinutes, setSeconds } = require('date-fns');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');

module.exports = function({ commitsPerDay, workdaysOnly, startDate, endDate, range }) {
    const commitDateList = createCommitDateList({
        workdaysOnly,
        commitsPerDay: commitsPerDay.split(','),
        startDate: startDate ? parse(startDate) : addYears(new Date(), -1),
        endDate: endDate ? parse(endDate) : new Date(),
        range: parseInt(range),
    });

    (async function() {
        const spinner = ora('Generating your GitHub activity\n').start();

        const historyFolder = 'my-history';

        // Create git history folder.
        if (!existsSync(`./${historyFolder}`)) {
            await execAsync(`mkdir ${historyFolder}`);
        }

        process.chdir(historyFolder);
        await execAsync(`git init`);

        // Create commits.
        for (const date of commitDateList) {
            // Change spinner so user can get the progress right now.
            const dateFormatted = new Intl.DateTimeFormat('en', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date);
            spinner.text = `Generating your Github activity... (${dateFormatted})\n`;

            await execAsync(`echo "${date}" > README.md`);
            await execAsync(`git add .`);
            await execAsync(
                `set GIT_COMMITTER_DATE=${date} && git commit --quiet --date "${date}" -m "Updated README.md"`
            );
        }

        spinner.succeed();

        console.log(
            boxen(
                `${chalk.green('Success')} ${commitDateList.length} commits have been created.
      If you rely on this tool, please consider buying me a cup of coffee. I would appreciate it 
      ${chalk.blueBright('https://www.buymeacoffee.com/artiebits')}`,
                { borderColor: 'yellow', padding: 1, align: 'center' }
            )
        );
    })();
};

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createCommitDateList({ commitsPerDay, workdaysOnly, startDate, endDate, range }) {
    const commitDateList = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        if (workdaysOnly && isWeekend(currentDate)) {
            currentDate = addDays(currentDate, getRandomIntInclusive(0, range));
            continue;
        }
        for (let i = 0; i < getRandomIntInclusive(...commitsPerDay); i++) {
            const dateWithHours = setHours(currentDate, getRandomIntInclusive(9, 16));
            const dateWithHoursAndMinutes = setMinutes(dateWithHours, getRandomIntInclusive(0, 59));
            const commitDate = setSeconds(dateWithHoursAndMinutes, getRandomIntInclusive(0, 59));

            commitDateList.push(commitDate);
        }
        currentDate = addDays(currentDate, getRandomIntInclusive(0, range));
    }

    return commitDateList;
}
