const http = require("http")
const fetch = require('node-fetch');
const { performance } = require('perf_hooks');

var t0 = performance.now()

let settings = { method: "Get" };
// https://s3.amazonaws.com/irs-form-990/201541349349307794_public.xml
let buffer;
let parseXml = async (curUrl) => {
  const path = curUrl.slice(24)
  // console.log(path);
  let answer;
  let t2 = performance.now();
  await http
    .request(
      {
        hostname: "s3.amazonaws.com",
        path: path
      },
      res => {
        let data = ""
  
        res.on("data", d => {
          data += d
        })
        res.on("end", () => {
            buffer = data;
          // console.log(buffer)
          var parseString = require('xml2js').parseString;
          var xml = buffer;
          parseString(xml, function (err, result) {
            answer = result.Return.$.returnVersion;
            console.log(result.Return.$.returnVersion);
            // console.log(result.Return.ReturnHeader[0].Filer[0].EIN);
          });
        })
      }
    ).end();
  let t3 = performance.now();
  console.log("Call took " + (t3 - t2) + " milliseconds.");
  return answer;
}

let url = "https://s3.amazonaws.com/irs-form-990/index_2013.json";

fetch(url, settings)
  .then(res => res.json())
  .then(async (json) => {
    // do something with JSON
    // json.Filings2013.forEach(element => {
    //   console.log(element)
    // });
    console.log(json.Filings2013[0]);
    console.log(await parseXml(json.Filings2013[0].URL));
    console.log({ length: json.Filings2013.length });
    // const amountFirstFormat = json.Filings2013.reduce((acc, cur) => {
      //   if (parseXml(cur.URL) === firstFormat) return acc + 1;
      //   return acc;
      // }, 0);
      // console.log({ amountFirstFormat });
      var t1 = performance.now()
      console.log("Call took " + Math.floor((t1 - t0) / 1000) + " seconds.");
      console.log(json.Filings2013);
  });
