const fs = require('fs');
const fetch = require('node-fetch');

const rawdata = fs.readFileSync('2013Index.json');
const filingsIndex = JSON.parse(rawdata);
const parseString = require('xml2js').parseString;

// for (key in filingsIndex) console.log({ key, type: typeof key });
// console.log(filingsIndex.Filings2013.length);

// filingsIndex.Filings2013.forEach(filing => {
//     const url = filing.URL;
//     fetch(url, { method: 'GET' }).then(res => console.log(res));
// });

// console.log(filingsIndex.Filings2013[0]);
const filing = filingsIndex.Filings2013[0];
const { EIN, TaxPeriod } = filing;
const data = { EIN, TaxPeriod };

fetch(
    filingsIndex.Filings2013[0].URL
    , { method: 'GET' }
    ).then(res => res.text()).then(xmlDoc => {
        // console.log(xmlDoc);
        parseString(xmlDoc, (err, result) => {
            const { returnVersion } = result.Return.$;
            switch ( returnVersion ) {
                case '2012v2.1':
                    parse2012v2d1(xmlDoc);
                    break;
                default:
                    console.log(`Return version ${returnVersion} not handled.`);
            }
        })
    });
    
parse2012v2d1 = (xmlDoc) => {
    let info;
    parseString(xmlDoc, (err, result) => {
        info = result.Return.ReturnData[0].IRS990EZ[0].OfficerDirectorTrusteeKeyEmpl[0];
        const officerData = result.Return.ReturnHeader[0].Officer[0];
        data.officer = {};
        data.officerTitle = officerData.Title[0];
        data.officerName = officerData.Name[0];
        // const keyEmployee = result.Return.ReturnData[0].IRS990EZ[0].OfficerDirectorTrusteeKeyEmpl[0];
        const keyEmployeesArray = result.Return.ReturnData[0].IRS990EZ[0].OfficerDirectorTrusteeKeyEmpl;
        keyEmployeesArray.forEach((employee, index) => {
            data[`employee${index}Name`] = employee.PersonName[0];
            data[`employee${index}Title`] = employee.Title[0];
            data[`employee${index}AvgHoursPerWkDevotedToPosition`] = employee.AvgHoursPerWkDevotedToPosition[0];
            data[`employee${index}Compensation`] = employee.Compensation[0];
            data[`employee${index}ContriToEmplBenefitPlansEtc`] = employee.ContriToEmplBenefitPlansEtc[0];
            data[`employee${index}ExpenseAccountOtherAllowances`] = employee.ExpenseAccountOtherAllowances[0];
        });
        // data.AvgHoursPerWkDevotedToPosition = keyEmployee.AvgHoursPerWkDevotedToPosition[0];
        // data.HighestCompensated = result.Return.ReturnData[0].IRS990EZ[0].PartVIOfCompOfHighestPaidEmpl[0];
    });
    console.log(xmlDoc);
    console.log();
    console.log({ info, data });
}