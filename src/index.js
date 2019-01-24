#! /usr/bin/env node

/**
 * Import third party packages
 */
const axios = require('axios');
const chalk = require('chalk');
const minimist = require('minimist');
const ora = require('ora');
const uuid = require('uuid/v4');

/**
 * App has started, notify the user
 */
console.log(chalk.red('Todoist CLI'));

/**
 * In order to do anything we must first have a valid API token, let's try and find one.
 */
const token = process.env.TODOIST_TOKEN;
if (!token) {
  console.log(chalk.red.bold('API token not set.'));
  console.log(
    'Please add a valid token to your environment as `TODOIST_TOKEN`, eg. by running `export TODOIST_TOKEN="MY_API_TOKEN"`.'
  );
  console.log(
    'You can find your token at: https://todoist.com/prefs/integrations.'
  );
  process.exit(1);
}

/**
 * Set up HTTP client
 */
const api = axios.create({
  baseURL: 'https://beta.todoist.com/API/v8/',
  timeout: 1000,
  headers: { 'Authorization': 'Bearer ' + token, 'X-Request-Id': uuid(), 'Content-Type': 'application/json' },
  responseType: 'json'

});

async function getProjects() {
  const { data } = await api.get('projects');
  return data;
}

async function listProjects() {
  let projects = await getProjects();
  projects.forEach(project => {
    console.log(project.name);
  });
}

async function resolveProject(projectName) {
  const projects = await getProjects();
  const project = projects.find(p => p.name.localeCompare(projectName, undefined, { sensitivity: 'base' }) == 0);
  if (project == null) return 0;
  return project.id;
}

async function listItems({ projectName }) {
  const spinner = ora('Fetching tasks').start();

  try {
    let { data } = await api.get('tasks');
    spinner.succeed('Fetched!');

    if (projectName) {
      spinner.text = `Resolving project '${projectName}'`;
      const projectId = await resolveProject(projectName);
      if (projectId == 0) {
        spinner.fail(`Project '${projectName}' not found.`);
        return;
      } else {
        spinner.text = 'Filtering by project';
        data = data.filter(p => (p.project_id == projectId));
      }
    }
    data.forEach(task => {
      console.log(task.content);
    });
  } catch (e) {
    spinner.fail(`${e}`);
  }
}

async function addTask(task, opts) {
  const spinner = ora('Creating task').start();

  // Add project id if specified
  if (opts.projectName) {
    spinner.text = `Resolving ${opts.projectName}`;
    let projectId = await resolveProject(opts.projectName);
    if (projectId == 0) {
      spinner.fail(`Project '${opts.projectName}' not found.`);
      return;
    }
    spinner.text = 'Resolved project';
    task.project_id = projectId;
  }

  // Post task
  spinner.text = 'Posting task';
  try {
    let { data } = await api.post('tasks', task);
    spinner.succeed('Posted!');
  } catch (e) {
    spinner.fail(`${e}`);
    // if (e.response) {
    //   console.log(e.response.data);
    //   console.log(e.response.headers);
    // }
    // console.log(task);
    return;

  }

}

/**
 * The user should now be able to choose what they would like to do. 
 * Let's ensure that we've got a valid set or arguments being passed and guide the user accordingly.
 */
const argv = minimist(process.argv.slice(2));

let opts = {
  projectName: argv['project'] || argv['p']
}

switch (true) {
  case Boolean(argv['projects']):
    listProjects();
    break;
  case Boolean(argv['list'] || argv['l']):
    listItems(opts);
    break;
  case Boolean(argv['add']):
    let task = {};
    if (Boolean(argv['d]'] || argv['due'])) {
      task['due_string'] = argv['d'] || argv['due'];
    }
    task['content'] = argv['add'];
    addTask(task, opts);
    break;
  default:
    const helpText = `
  Allows for adding and listing tasks from Todoist.
  
  commands:
    --add     -a    Add a task
    --list    -l    List tasks
    --projects      List projects

  options:
    --due     -d    A date string, eg. tomorrow, 'every day @ 10'
    --project -p    Filters task list, or sets project when adding a new task

  example:
    todoist-cli --due sunday --add "Walk the dog"
    todoist-cli --list --project "Shopping"
  `;
    console.log(helpText);

}
