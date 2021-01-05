const fs = require('fs');
const fetch = require('node-fetch');
const { convertArrayToCSV } = require('convert-array-to-csv');

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
const array = [];

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
        data.officerTitle = officerData.Title[0];
        data.officerName = officerData.Name[0];
        const keyEmployeesArray = result.Return.ReturnData[0].IRS990EZ[0].OfficerDirectorTrusteeKeyEmpl;
        data.preparerFirm = result.Return.ReturnHeader[0].PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1[0];
        // console.log({ employeesArray: keyEmployeesArray.map(emp => {
        //     return {
        //         name: emp.PersonName[0],
        //         title: emp.Title[0],
        //         avgHoursPerWk: emp.AvgHoursPerWkDevotedToPosition[0],
        //         compensation: emp.Compensation[0],
        //         contributionToBenefits: emp.ContriToEmplBenefitPlansEtc[0],
        //         expenseAllowances: emp.ExpenseAccountOtherAllowances[0],
        //     }
        // }) });
        keyEmployeesArray.forEach((employee) => {
            const tmp = { ...data };
            tmp[`employeeName`] = employee.PersonName[0];
            tmp[`employeeTitle`] = employee.Title[0];
            tmp[`employeeAvgHoursPerWkDevotedToPosition`] = employee.AvgHoursPerWkDevotedToPosition[0];
            tmp[`employeeCompensation`] = employee.Compensation[0];
            tmp[`employeeContriToEmplBenefitPlansEtc`] = employee.ContriToEmplBenefitPlansEtc[0];
            tmp[`employeeExpenseAccountOtherAllowances`] = employee.ExpenseAccountOtherAllowances[0];
            array.push(tmp);
        });
        // data.AvgHoursPerWkDevotedToPosition = keyEmployee.AvgHoursPerWkDevotedToPosition[0];
        // data.HighestCompensated = result.Return.ReturnData[0].IRS990EZ[0].PartVIOfCompOfHighestPaidEmpl[0];
    });

    const csv = convertArrayToCSV(array);
    fs.writeFile('myCSVFile.csv', csv, (err, data) => {
        if (err) return console.log(err);
    });

    console.log(xmlDoc);
    // console.log();
    // console.log({ info, data });
    // console.log();
    // console.log({ array, csv });
}