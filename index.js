#!/usr/bin/env node
const { program } = require('commander');

program
	.version('1.0.0')
	.description('A simple CLI to greet users')
	.argument('<name>', 'name of the user to greet')
	.action((name) => {
		console.log(`Hello, ${name}!`);
	});

program.parse(process.argv);
