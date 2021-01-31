const fs = require('fs');
const fetch = require('node-fetch');
const xmlParse = require('xml2js').parseString;

downloadFilings = async () => {
    const indexJSON = fs.readFileSync('2013Index.json');
    const filingsIndex = JSON.parse(indexJSON);
    const einArray = [];
    const filings = filingsIndex.Filings2013.slice(0, 16);
    
    const urlArray = filings.map((filing, index) => {
        const ein = filing.EIN;
        einArray.push(ein);
        console.log('push fetch', index);
        return filing.URL;
    });

    downloadSubarray = async (subarray, beg) => {
        return new Promise(resolve => {
            Promise.all(subarray.map((url, i) => {
                console.log({ number: beg + i, url, of: filings.length });
                fetch(url).then(resp => resp.text().then(xmlDoc => {
                    const ein = filings[i].EIN;
                    console.log({ i, ein });
                    fs.writeFileSync(`xmlFiles/${ein}.xml`, xmlDoc, writeFileCb);
                }));
            })).then(resolve());
        });
    }

    await downloadSubarray(urlArray.slice(0, 4));
    await downloadSubarray(urlArray.slice(4, 8));
    await downloadSubarray(urlArray.slice(8, 12));
    await downloadSubarray(urlArray.slice(12, 16));

    // let prev = 0;
    // for (let i = 5; i < filings.length; i += 5) {
    //     console.log('downloadSubarray: ', { prev, i });
    //     await downloadSubarray(urlArray.slice(prev, i), prev);
    //     console.log('awaited');
    //     prev = i;
    // }
    // console.log('downloadSubarray: ', { prev, i: filings.length });
    // await downloadSubarray(urlArray.slice(prev, filings.length), prev);

    console.log('write xmlFilenames');
    fs.writeFile('xmlFilenames.json', JSON.stringify(einArray), writeFileCb);
}

writeFileCb = (err) => {if (err) throw err};

testArrayToJSONFile = () => {
    var arr = [ "John", "Peter", "Sally", "Jane" ];
    var myJSON = JSON.stringify(arr);
    fs.writeFileSync('differentDir/testArrayJSON.json', myJSON, (err) => {if (err) throw err});
    const arrayFromRead = JSON.parse(fs.readFileSync('testArrayJSON.json'));
    console.log(arrayFromRead);
}

// testArrayToJSONFile();

(async () => await downloadFilings())();
