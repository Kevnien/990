const fs = require('fs');
const fetch = require('node-fetch');

let url = "https://s3.amazonaws.com/irs-form-990/index_2013.json";
fetch(url, { method: 'Get'})
    .then(res => res.json())
    .then(json => {
        const data = JSON.stringify(json);
        // fs.writeFile('2013Index.json', data);
        fs.writeFile('2013Index.json', data, 'utf8', cbres => {
            console.log(cbres);
        });
    });
