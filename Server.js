const express = require('express');
const mysql = require('mysql')
const config = require('config');


const app = express();

app.get('/get-movies', (req, res) => {

});

app.post('/upload-comment', (req, res) => {

});

app.get('/get-comments', (req, res) => {

});

app.listen(4000, () => {
    console.log("Server started!");
});

const databaseHandle = (operation, query) => {
    const connection = mysql.createConnection({
        host: config.get("db.host"),
        user: config.get("db.user"),
        password: config.get("db.password"),
        database: config.get("db.database"),
    })

    switch (operation) {
        case "start":
            connection.connect();
            break;
        case "end":
            connection.end();
            break;
        case "query":

    }

}