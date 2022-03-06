const express = require('express');
const mysql = require('mysql')
const config = require('./config');
const multer = require('multer')
const storage = multer.diskStorage(
    {
        destination: 'public/comments',
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    }
);
const upload = multer({storage: storage});

const fs = require('fs');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const {IamAuthenticator} = require('ibm-watson/auth');
const LanguageTranslatorV3 = require("ibm-watson/language-translator/v3");

const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({apikey: "wX7gWXAuiQXARWqxoS-U3gjCl485alnBiiKkbZcFCBrb"}),
    serviceUrl: "https://api.eu-gb.speech-to-text.watson.cloud.ibm.com/instances/1467cec4-728c-41d3-92bc-3de12e8ed648"
});

const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({apikey: "Qfr3JrEZcgqkX3vyGLGUChIhJO0pB4EeTGauMiiY-p2y"}),
    version: '2018-04-05',
    serviceUrl: "https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/8a07949e-983d-4920-86ed-6ee2a32e61f1"
});

const languageTranslator = new LanguageTranslatorV3({
    authenticator: new IamAuthenticator({apikey: 'dxHHoekwIt8IUL-M71WFtBnv-edQyTr1PgPiqPVsofsQ'}),
    version: '2018-05-01',
    serviceUrl: 'https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/dce31891-6dd2-405b-8f6d-fd5431e056a3',
});


const app = express();

app.get('/get-movies', (req, res) => {
    databaseHandle("query", "SELECT * FROM movies").then(rows => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({movies: rows});

    }).catch(e => {
        console.log(e);
        res.sendStatus(500);
    })
});

app.post('/add-comment', upload.single('comment'), function (req, res) {
    let movie = req.body.movie;
    const params = {
        // From file
        audio: fs.createReadStream(`public/comments/${req.file.filename}`),
        contentType: 'audio/mp3; rate=44100'
    };

    speechToText.recognize(params)
        .then(response => {
            let commentText = response.result.results[0].alternatives[0].transcript;

            nlu.analyze(
                {
                    html: commentText,
                    features: {
                        keywords: {emotion: true}
                    }
                })
                .then(response => {
                    let weightedAngerSum = 0;
                    let count = 0;
                    response.result.keywords.forEach(keyword => {
                        weightedAngerSum += keyword.emotion.anger * keyword.count;
                        count += 1;
                    })
                    let angerIndex = (weightedAngerSum / count) * 100;


                    if (angerIndex < 50) {
                        databaseHandle("query", `INSERT INTO comments(commentText, anger, movie) VALUES("${commentText}", ${angerIndex}, "${movie}")`).then(result => {
                            if (result.affectedRows > 0) {
                                fs.unlink(`public/comments/${req.file.filename}`, (err) => {
                                    if (err) throw err;
                                    console.log(`${req.file.filename} deleted!`);
                                    res.setHeader('Access-Control-Allow-Origin', '*');
                                    res.status(200).json({anger: angerIndex});
                                });
                            }
                        }).catch(e => {
                            console.log(e);
                            res.sendStatus(500);
                        })
                    } else {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        res.status(200).json({anger: angerIndex});
                    }

                })
                .catch(err => {
                    console.log('error: ', err);
                });
        })
        .catch(err => {
            console.log(err);
        });

});


app.get('/get-comments', (req, res) => {
    let language = req.query.language;
    databaseHandle("query", `SELECT * FROM comments where movie = '${req.query.movie}'`).then(rows => {
        switch (language) {
            case "English":
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.status(200).json({comments: rows});
                break;
            case "Spanish":
                recreateRows(rows, "es").then(newRows => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.status(200).json({comments: newRows});
                })
                break;
            case "French":
                recreateRows(rows, "fr").then(newRows => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.status(200).json({comments: newRows});
                })
                break;

        }


    }).catch(e => {
        console.log(e);
        res.sendStatus(500);
    })
});

app.listen(5000, () => {
    console.log("Server started!");
});

const databaseHandle = (operation, queryText) => {
    const connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        port: config.db.port
    })

    switch (operation) {
        case "start":
            connection.connect();
            return "db connected";
        case "end":
            connection.end();
            return "db disconnected";
        case "query":
            return new Promise((resolve, reject) => {
                connection.query(queryText, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(result);
                })
            })
    }
}

const translate = async (commentText, destLang) => {
    return await languageTranslator.translate(
        {
            text: commentText,
            source: 'en',
            target: destLang
        })
        .then(response => {
            return response.result.translations[0].translation
        })
        .catch(err => {
            console.log('error: ', err);
            return "Error"
        });
}

const translateComments = async (orgComments, destLang) => {
    return Promise.all(orgComments.map((comment) => translate(comment.commentText, destLang)
    ))
}

const recreateRows = (rows, destLang) => {
    return translateComments(rows, destLang).then(newTexts => {
        let index = 0;
        newTexts.forEach(newText => {
            rows [index].commentText = newText;
            index++;
        })
        return rows;
    })
}