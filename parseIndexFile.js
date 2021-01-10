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
    parseString(xmlDoc, (err, result) => {
        const returnHeader = result.Return.ReturnHeader[0];
        const officerData = returnHeader.Officer[0];
        const returnData = result.Return.ReturnData[0];
        const form990Ez = returnData.IRS990EZ[0];
        data.officerTitle = officerData.Title[0];
        data.officerName = officerData.Name[0];
        const keyEmployeesArray = form990Ez.OfficerDirectorTrusteeKeyEmpl;
        data.highestPaidEmployeeCompensation = form990Ez.PartVIOfCompOfHighestPaidEmpl[0];
        data.relatedOrgControlledEntity = form990Ez.RelatedOrgControlledEntity[0];
        data.preparerFirm = returnHeader.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1[0];
        data.relatedOrgControlledEntity = form990Ez.RelatedOrgControlledEntity[0];
        data.description = form990Ez.ProgramServiceAccomplishment[0].DescriptionProgramServiceAccom[0];
        const totalAssets = form990Ez.TotalAssets[0];
        data.totalAssetsBOY = totalAssets.BOY[0];
        data.totalAssetsEOY = totalAssets.EOY[0];
        const sumOfTotalLiabilities = form990Ez.SumOfTotalLiabilities[0];
        data.liabilitiesBOY = sumOfTotalLiabilities.BOY[0];
        data.liabilitiesEOY = sumOfTotalLiabilities.EOY[0];
        data.expenses = form990Ez.TotalExpenses[0];
        data.revenue = form990Ez.TotalRevenue[0];
        data.taxPeriodBeginDate = returnHeader.TaxPeriodBeginDate[0];
        data.taxPeriodEndDate = returnHeader.TaxPeriodEndDate[0];
        data.taxYear = returnHeader.TaxYear[0];
        data.businessName = returnHeader.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1[0];
        const filer = returnHeader.Filer[0];
        const address = filer.USAddress[0]
        data.addressLine1 = address.AddressLine1[0];
        data.city = address.City[0];
        data.state = address.State[0];
        data.zipCode = address.ZIPCode[0];
        data.formType = form990Ez.$.documentId;
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

    // console.log(xmlDoc);
    // console.log();
    // console.log({ data });
    // console.log();
    // console.log({ array, csv });
}