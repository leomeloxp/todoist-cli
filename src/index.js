#! /usr/bin/env node

/**
 * Import third party packages
 */
const fetch = require('axios');
const chalk = require('chalk');
const minimist = require('minimist');
const ora = require('ora');
const uuid = require('uuid');

/**
 * App has started, notify the user
 */
console.log(chalk.red('Todoist CLI'));

/**
 * In order to do anything we must first have a valid API token, let's try and find one.
 */
const token = process.env.TODOIST_TOKEN;
if (!token) {
  console.log(chalk.red.bold('NO API TOKEN FOUND.'));
  console.log(
    'Please add a valid token to your environment as `TODOIST_TOKEN`, eg. by running `export TODOIST_TOKEN="MY_API_TOKEN"`.'
  );
  console.log(
    'You can find your token at: https://todoist.com/Users/viewPrefs?page=authorizations.'
  );
  process.exit(1);
}

const createTask = (task = {}) => {
  const spinner = ora('Creating task').start();

  /**
   * Prepare task creation payload
   */
  const commandUUID = uuid();
  const temp_id = uuid();
  let data = [];
  data.push({
    type: 'item_add',
    temp_id,
    uuid: commandUUID,
    args: task
  });

  fetch('https://todoist.com/api/v7/sync', {
    method: 'POST',
    data: {
      token,
      commands: data
    }
  })
    .then(({ data }) => {
      if (data.sync_status[commandUUID] === 'oka') {
        spinner.succeed('Task added!');
        process.exit(0);
      } else {
        spinner.fail(
          `Something went wrong, sync status: ${data.sync_status[commandUUID]}`
        );
        process.exit(1);
      }
    })
    .catch(e => {
      spinner.fail(`${e}`);
      process.exit(1);
    });
};

/**
 * The user should now be able to choose what they would like to do. 
 * Let's ensure that we've got a valid set or arguments being passed and guide the user accordingly.
 */
const argv = minimist(process.argv.slice(2));
const notEnoughArgs = Boolean(argv['_'].length === 0);
let task = {};
switch (true) {
  case argv['h'] || argv['help'] || notEnoughArgs:
    const helpText = `
    Allows for addings tasks to your inbox on Todoist. Requires an API token to be set
    on your environment as TODOIST_TOKEN.

    usage: todoist [-d | --due <date_string>] <task_content>
    
    options:
      --due    -d    A date string, eg. tomorrow, 'every day @ 10'

    example:
      todoist -d sunday "Walk the dog"
    `;
    console.log(helpText);
    break;
  case Boolean(argv['d'] || argv['due']):
    task['date_string'] = argv['d'] || argv['due'];
  // Fall through to allow for adding content
  default:
    task['content'] = argv['_'].join(' ');
    createTask(task);
    break;
}
