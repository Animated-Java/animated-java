const { initializeApp } = require('firebase/app')
const { getStorage, ref, uploadString } = require('firebase/storage')
const core = require('@actions/core')
console.log(Object.keys(process.env))
const app = initializeApp({
	apiKey: core.getInput('API_KEY'),
	authDomain: core.getInput('AUTH_DOMAIN'),
	projectId: core.getInput('PROJECT_ID'),
	storageBucket: core.getInput('STORAGE_BUCKET'),
	messagingSenderId: core.getInput('MESSAGE_SENDER_ID'),
	appId: core.getInput('APP_ID'),
	measurementId: core.getInput('MEASUREMENT_ID'),
})
const store = getStorage(app)
const build = ref(
	store,
	`builds/${core.getInput('GITHUB_REF')}/animated_java.js`
)

const fs = require('fs')
uploadString(build, fs.readFileSync('./dist/animated_java.js', 'utf8')).then(
	(snapshot) => {
		console.log(
			'Uploaded animated java to ',
			`builds/${process.argv[2]}/animated_java.js`
		)
	}
)
