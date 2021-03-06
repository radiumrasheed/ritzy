const format = require('util').format;
const express = require('express');
const Multer = require('multer');
const bodyParser = require('body-parser');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const {Storage} = require('@google-cloud/storage');

// Instantiate a storage client
const storage = new Storage();

const app = express();
app.set('view engine', 'pug');
app.use(bodyParser.json());

// Multer is required to process file uploads and make them available via
// req.files.
const multer = Multer({
	storage: Multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
	}
});

// A bucket is a container for objects (files).
const bucket = storage.bucket('GCLOUD_STORAGE_BUCKET');

// Display a form for uploading files.
app.get('/', (req, res) => {
	res.render('index');
});

// Process the file upload and upload to Google Cloud Storage.
app.post('/', multer.single('file'), (req, res, next) => {

	if (!req.file) {
		res.status(400).send('No file uploaded.');
		return;
	}

	// Create a new blob in the bucket and upload the file data.
	const blob = bucket.file(req.file.originalname);
	const blobStream = blob.createWriteStream();

	blobStream.on('error', (err) => {
		console.error(err);
		res.status(500).send(err);
	});

	blobStream.on('finish', () => {
		// The public URL can be used to directly access the file via HTTP.
		const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
		res.status(200).send(publicUrl);
	});

	blobStream.end(req.file.buffer);
});

module.exports = app;
