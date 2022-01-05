const { initializeApp } = require('firebase/app')
const { getStorage, ref, uploadString } = require('firebase/storage')
const { getInput } = require('@actions/core')
console.log(getInput('STORAGE_BUCKET'))
const app = initializeApp({
	apiKey: getInput('API_KEY'),
	authDomain: getInput('AUTH_DOMAIN'),
	projectId: getInput('PROJECT_ID'),
	storageBucket: getInput('STORAGE_BUCKET'),
	messagingSenderId: getInput('MESSAGE_SENDER_ID'),
	appId: getInput('APP_ID'),
	measurementId: getInput('MEASUREMENT_ID'),
})
const store = getStorage(app)
const build = ref(store, `builds/${getInput('GITHUB_REF')}/animated_java.js`)

const fs = require('fs')
uploadString(build, fs.readFileSync('./dist/animated_java.js', 'utf8')).then(
	(snapshot) => {
		console.log(
			'Uploaded animated java to ',
			`builds/${process.argv[2]}/animated_java.js`
		)
	}
)
