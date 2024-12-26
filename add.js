#!/usr/bin/env node
const { program } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { input, select } = require('@inquirer/prompts');

const branch = 'main';
const encodedBranch = encodeURIComponent(branch);

// // 토큰 저장 파일 경로
const tokenFilePath = path.resolve(__dirname, '.token');

// 토큰을 파일에 저장하는 함수
const saveToken = (token) => {
	fs.writeFileSync(tokenFilePath, token, 'utf8');
};

// // 토큰을 불러오는 함수
const loadToken = () => {
	if (fs.existsSync(tokenFilePath)) {
		return fs.readFileSync(tokenFilePath, 'utf8');
	}
	return null;
};

const tokenCheck = async () => {
	let token = loadToken();

	if (!token) {
		const answer = await input({ message: 'Please enter your GitHub Personal Access Token:' });

		token = answer;
		saveToken(answer);
	}
};

const downloadComponent = async (component) => {
	let token = loadToken();

	// const url = `https://raw.githubusercontent.com/Dever-Rai/vue-storybook/main/src/components/ui/${component}/${component}.vue`;
	const url = `https://raw.githubusercontent.com/devercorp/default/${encodedBranch}/src/components/${component}/${component}.vue`;
	const dest = path.resolve(process.cwd() + `/src/components/ui/${component}`, `${component}.vue`);

	try {
		console.log('경로 : ' + `/src/components/ui/${component}`);
		console.log(
			'컴포넌트 주소 : ' + `https://github.com/devercorp/default/tree/${encodedBranch}/src/components/${component}`
		);

		const response = await axios.get(url, {
			headers: {
				Authorization: `token ${token}`, // 토큰을 헤더에 추가
			},
		});
		await fs.outputFile(dest, response.data);
		console.log(`${component}.vue 다운로드 완료`);
	} catch (error) {
		console.error(`Error fetching component: ${error.message}`);
	}
};

const getComponentList = async () => {
	let token = loadToken();

	// const url = 'https://api.github.com/repos/Dever-Rai/vue-storybook/contents/src/components/ui';
	const url = `https://api.github.com/repos/devercorp/default/contents/src/components?ref=${branch}`;

	try {
		const response = await axios.get(url, {
			headers: {
				Accept: 'application/vnd.github.v3+json', // GitHub API 버전 지정
				Authorization: `token ${token}`, // 토큰을 헤더에 추가
			},
		});
		// response.data는 디렉토리 내 파일 정보 배열
		const files = response.data;

		return files.map((file) => file.name);
	} catch (error) {
		//
		if (error.status === 401) {
			console.log('접근 권한이 없습니다. 토큰을 확인해주세요.');
			fs.removeSync(tokenFilePath);
		}
		console.error('Error fetching component list:', error.message);
		return [];
	}
};

program
	.command('add')
	.option('-a')
	.description('Add a specific component to your project')
	.action(async (option) => {
		await tokenCheck();

		const componentList = await getComponentList();

		if (componentList.length === 0) {
			console.log('컴포넌트가 존재하지 않습니다.');
			return;
		}

		if (option.a) {
			for (const component of componentList) {
				await downloadComponent(component);
			}
		} else {
			console.log(componentList);
			const component = await select({ message: '컴포넌트를 선택해주세요.', choices: componentList });
			console.log('선택한 컴포넌트 : ' + component);
			await downloadComponent(component);
		}
	});

program.parse(process.argv);
