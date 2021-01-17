const fs = require('fs');
const fetch = require('node-fetch');
const { convertArrayToCSV } = require('convert-array-to-csv');

const rawdata = fs.readFileSync('2013Index.json');
const filingsIndex = JSON.parse(rawdata);
const parseString = require('xml2js').parseString;
const data = {};
let array = [];
const unhandled = {};
let count = 0;
const header = ['officerTitle', 'description', 'officerName', 'highestPaidEmployeeCompensation', 'relatedOrgControlledEntity', 'preparerFirm', 'relatedOrgControlledEntity', 'totalAssetsBOY', 'totalAssetsEOY', 'liabilitiesBOY', 'liabilitiesEOY', 'expenses', 'revenue', 'taxPeriodBeginDate', 'taxPeriodEndDate', 'taxYear', 'businessName', 'addressLine1', 'city', 'state', 'zipCode', 'formType']

parseFiling = async (filingUrl) => {
    await fetch(
        filingUrl
        , { method: 'GET' }
        ).then(res => res.text()).then(xmlDoc => {
            parseString(xmlDoc, (err, result) => {
                const { returnVersion } = result.Return.$;
                console.log({filingUrl});
                switch ( returnVersion ) {
                    case '2012v2.1':
                        parse2012v2d1(xmlDoc);
                        break;
                    default:
                        handleUnhandled(returnVersion);
                }
            });
            count++;
        });
};

    
parse2012v2d1 = (xmlDoc) => {
    parseString(xmlDoc, (err, result) => {
        const returnHeader = result?.Return?.ReturnHeader?.pop();
        const officerData = returnHeader?.Officer?.pop();
        const returnData = result?.Return?.ReturnData?.pop();
        const form990Ez = returnData.IRS990EZ && returnData.IRS990EZ[0];
        data.officerTitle = officerData?.Title && officerData.Title[0];
        data.officerName = officerData?.Name && officerData.Name[0];
        const keyEmployeesArray = form990Ez?.OfficerDirectorTrusteeKeyEmpl;
        data.highestPaidEmployeeCompensation = form990Ez?.PartVIOfCompOfHighestPaidEmpl && form990Ez?.PartVIOfCompOfHighestPaidEmpl[0];
        data.relatedOrgControlledEntity = form990Ez?.RelatedOrgControlledEntity && form990Ez?.RelatedOrgControlledEntity?.pop();
        data.preparerFirm = returnHeader?.PreparerFirm && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1 && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1[0];
        data.description = form990Ez?.ProgramServiceAccomplishment?.pop().DescriptionProgramServiceAccom?.pop();
        const totalAssets = form990Ez?.TotalAssets?.pop();
        data.totalAssetsBOY = totalAssets?.BOY && totalAssets.BOY[0];
        data.totalAssetsEOY = totalAssets?.EOY.pop();
        const sumOfTotalLiabilities = form990Ez?.SumOfTotalLiabilities && form990Ez.SumOfTotalLiabilities[0];
        data.liabilitiesBOY = sumOfTotalLiabilities && sumOfTotalLiabilities.BOY?.pop();
        data.liabilitiesEOY = sumOfTotalLiabilities &&  sumOfTotalLiabilities.EOY?.pop();
        data.expenses = form990Ez?.TotalExpenses?.pop();
        data.revenue = form990Ez?.TotalRevenue?.pop();
        data.taxPeriodBeginDate = returnHeader?.TaxPeriodBeginDate?.pop();
        data.taxPeriodEndDate = returnHeader?.TaxPeriodEndDate?.pop();
        data.taxYear = returnHeader?.TaxYear?.pop();
        data.businessName = returnHeader?.PreparerFirm && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1 && returnHeader?.PreparerFirm[0].PreparerFirmBusinessName[0].BusinessNameLine1[0];
        const filer = returnHeader?.Filer && returnHeader?.Filer[0];
        const address = filer?.USAddress && filer?.USAddress[0]
        data.addressLine1 = address?.AddressLine1 && address?.AddressLine1[0];
        data.city = address?.City && address?.City[0];
        data.state = address?.State?.pop();
        data.zipCode = address?.ZIPCode?.pop();
        data.formType = form990Ez?.$?.documentId;
        keyEmployeesArray?.forEach((employee) => {
            const tmp = { ...data };
            tmp[`employeeName`] = employee.PersonName && employee.PersonName[0];
            tmp[`employeeTitle`] = employee.Title && employee.Title[0];
            tmp[`employeeAvgHoursPerWkDevotedToPosition`] = employee.AvgHoursPerWkDevotedToPosition && employee.AvgHoursPerWkDevotedToPosition[0];
            tmp[`employeeCompensation`] = employee.Compensation && employee.Compensation[0];
            tmp[`employeeContriToEmplBenefitPlansEtc`] = employee.ContriToEmplBenefitPlansEtc && employee.ContriToEmplBenefitPlansEtc[0];
            tmp[`employeeExpenseAccountOtherAllowances`] = employee.ExpenseAccountOtherAllowances && employee.ExpenseAccountOtherAllowances[0];
            array.push(tmp);
        });
    });
}

handleUnhandled = (returnVersion) => {
    unhandled[returnVersion] ? unhandled[returnVersion]++ : unhandled[returnVersion] = 1;
}

writeArrayToCsv = async (csvFileName) => {
    await convertArrayToCSV(array, { header: header });
    const csv = convertArrayToCSV(array);
    var stream = fs.createWriteStream(`${csvFileName}`, {flags:'a'});
    await stream.write(csv);
    await stream.end();
    count = 0;
    array = [];
}

parseFilings = async () => {
    const filings = filingsIndex.Filings2013;
    console.log({ length: filings.length });
    for (let i = 0; i < filings.length; i++) {
        console.log({ i });
        data.EIN = filings[i].EIN;
        data.TaxPeriod = filings[i].TaxPeriod;
        await parseFiling(filings[i].URL).then(async () => {
            count >= 100000 && await writeArrayToCsv('myAppendingCSVFile.csv');
        });
    }
    console.log(unhandled);
}

parseFilings();
