const express = require('express')
const bodyParser = require('body-parser')
const { Client } = require('pg')
const cors = require('cors');

const SERVER_PORT = 3001;

const get_verbose = false;
const post_verbose = false;
const put_verbose = true;

const time_12hours = false;

const app = express()
app.use(cors());
app.use(bodyParser.json())

function verboseOut(req, msg) {
    const clientIP = req.connection.remoteAddress.split(':').pop(); 
    const date = new Date().toLocaleDateString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: time_12hours, timeZoneName: 'short'});

    console.log('[' + date + ']: ' + clientIP + ' > ' + msg);
}

// Connect to the PostgreSQL database
const client = new Client({
    host: 'localhost', // Your PostreSQL host, usually localhost
    port: 5432, // Your PostgreSQL port
    user: '', // Your PostgreSQL username
    password: '', // Your PostgreSQL password
    database: '' // Your PostgreSQL database
})
client.connect()

// Create the data table if it doesn't exist
client.query(`
    CREATE TABLE IF NOT EXISTS data (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255), 
        username VARCHAR(255),
        password VARCHAR(255),
        custom_fields JSONB
    )
`)

// Endpoint to create a new data
app.post('/data', (req, res) => {
    const { name, username, password, custom_fields } = req.body
    client.query(`
        INSERT INTO data (name, username, password, custom_fields)
        VALUES ($1, $2, $3, $4)
    `, [name, username, password, custom_fields], (err, result) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(result)
            if (post_verbose) verboseOut(req, 'Data successfully received from client via POST request');
        }
    })
})

// Endpoint to update an existing user
app.put('/data/:id', (req, res) => {
    const { name, username, password, custom_fields } = req.body;
    const { id } = req.params;

    client.query(`
        UPDATE data SET name = $1, username = $2, password = $3, custom_fields = $4 WHERE id = $5
    `, [name, username, password, custom_fields, id], (err, result) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(result)
            if (put_verbose) verboseOut(req, 'Data successfully received from client via PUT request');
        }
    })
});


app.get('/data', (req, res) => {
    const clientIP = req.connection.remoteAddress
    const date = new Date();

    client.query('SELECT * FROM data', (err, result) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).json(result.rows)
            if (get_verbose) verboseOut(req, 'The data was successfully sent to the client via a GET request')
        }
    })
})

app.listen(SERVER_PORT, () => {
    console.log('Server is running')
    console.log(`Running on port ${SERVER_PORT}`)
})
