// const fs = require('fs');
// const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
// const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
// const { IamAuthenticator } = require('ibm-watson/auth');
//
// const speechToText = new SpeechToTextV1({
//     authenticator: new IamAuthenticator({ apikey: "wX7gWXAuiQXARWqxoS-U3gjCl485alnBiiKkbZcFCBrb" }),
//     serviceUrl: "https://api.eu-gb.speech-to-text.watson.cloud.ibm.com/instances/1467cec4-728c-41d3-92bc-3de12e8ed648"
// });
//
// const nlu = new NaturalLanguageUnderstandingV1({
//     authenticator: new IamAuthenticator({ apikey: "Qfr3JrEZcgqkX3vyGLGUChIhJO0pB4EeTGauMiiY-p2y" }),
//     version: '2018-04-05',
//     serviceUrl: "https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/8a07949e-983d-4920-86ed-6ee2a32e61f1"
// });
//
// const params = {
//     // From file
//     audio: fs.createReadStream('public/comments/Friends.mp3'),
//     contentType: 'audio/mp3; rate=44100'
// };
//
// speechToText.recognize(params)
//     .then(response => {
//         let commentText = response.result.results[0].alternatives[0].transcript;
//
//         nlu.analyze(
//             {
//                 html: commentText,
//                 features: {
//                     keywords: {emotion: true}
//                 }
//             })
//             .then(response => {
//                 console.log(JSON.stringify(response.result, null, 2));
//                 let angerSum = 0;
//                 let count = 0;
//                 response.result.keywords.forEach(keyword =>{
//                     angerSum += keyword.emotion.anger;
//                     count += keyword.count;
//                 })
//                 console.log((angerSum/count) * 100);
//                 let angerIndex = (angerSum/count) * 100;
//                 if (angerIndex < 50){
//
//                 }
//
//             })
//             .catch(err => {
//                 console.log('error: ', err);
//             });
//      })
//     .catch(err => {
//         console.log(err);
//     });
//
//

const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');
const { IamAuthenticator } = require('ibm-watson/auth');

const languageTranslator = new LanguageTranslatorV3({
    authenticator: new IamAuthenticator({ apikey: 'dxHHoekwIt8IUL-M71WFtBnv-edQyTr1PgPiqPVsofsQ' }),
    version: '2018-05-01',
    serviceUrl: 'https://api.eu-gb.language-translator.watson.cloud.ibm.com/instances/dce31891-6dd2-405b-8f6d-fd5431e056a3',
});

languageTranslator.translate(
    {
        text: 'My name is Nicky.',
        source: 'en',
        target: 'es'
    })
    .then(response => {
        console.log(response.result.translations[0].translation);
    })
    .catch(err => {
        console.log('error: ', err);
    });
