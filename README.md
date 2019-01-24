# todoist-cli

A CLI interface to Todoist built with Javascript

## Setup

Get your Todoist token via:

https://todoist.com/prefs/integrations

Set it to an environment variable:

Mac/Linux:

`export TODOIST_TOKEN=MY_API_TOKEN`

Windows (PowerShell):

`$env:TODOIST_TOKEN = "MY_API_TOKEN"`

Install dependencies:

`yarn install`

## Run

```
todoist-cli
```

## Usage

Add a task "Walk the dog", due on Sunday

```
todoist-cli --due sunday --add "Walk the dog"
```

List all tasks in the "Shopping" project

```
todoist-cli --list --project "Shopping"
```

List all projects

```
todoist-cli --projects
```

## License

[MIT](./LICENSE)

## Credits

* Leonardo Melo <hello@leomeloxp.net>
* Clint Heyer