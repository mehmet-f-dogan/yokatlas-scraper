import { Browser, Page } from "puppeteer";
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';

type ProgramDetailsRecord = {
    collegeName: string,
    facultyName: string,
    programmeName: string,
    scoreType: string,
    femaleCount: number,
    maleCount: number,
    totalCount: number,
    historicFemaleCount: number,
    historicMaleCount: number,
    historicTotalCount: number,
    localCount: number,
    nonLocalCount: number,
}

// Function to combine and replace the group
function removeTailFromProgramName(programName: string) {
    const tailRegex = /\s\((?:\%\d* İndirimli|Ücretli|Burslu|KKTC Uyruklu)\)$/i;
    return programName.replace(tailRegex, '').trim();
}

// Function to combine and replace the group
function combineAndReplaceGroup(records: ProgramDetailsRecord[]) {
    const result: ProgramDetailsRecord[] = [];

    for (const record of records) {
        let { collegeName, facultyName, programmeName, scoreType } = record;
        //const group = `${collegeName}\t${facultyName}\t${removeTailFromProgramName(programmeName)}`;
        programmeName = removeTailFromProgramName(programmeName)
        const existingRecordIndex = result.findIndex((r) => r.programmeName === programmeName && r.collegeName === collegeName && r.facultyName === facultyName);
        if (existingRecordIndex == -1) {
            result.push({
                collegeName,
                facultyName,
                programmeName,
                scoreType,
                femaleCount: record.femaleCount,
                maleCount: record.maleCount,
                totalCount: record.totalCount,
                historicFemaleCount: record.historicFemaleCount,
                historicMaleCount: record.historicMaleCount,
                historicTotalCount: record.historicTotalCount,
                localCount: record.localCount,
                nonLocalCount: record.nonLocalCount
            });
        } else {
            console.log(result[existingRecordIndex])
            console.log(record)

            result[existingRecordIndex].femaleCount += record.femaleCount;
            result[existingRecordIndex].maleCount += record.maleCount;
            result[existingRecordIndex].totalCount += record.totalCount;
            result[existingRecordIndex].historicFemaleCount += record.historicFemaleCount;
            result[existingRecordIndex].historicMaleCount += record.historicMaleCount;
            result[existingRecordIndex].historicTotalCount += record.historicTotalCount;
            result[existingRecordIndex].localCount += record.localCount;
            result[existingRecordIndex].nonLocalCount += record.nonLocalCount;
            console.log(result[existingRecordIndex])

        }
    }

    return result;
}


const jsonData1 = fs.readFileSync("./data-1.json", 'utf-8');
const jsonData2 = fs.readFileSync("./data.json", 'utf-8');
const data1 = JSON.parse(jsonData1);
const data2 = JSON.parse(jsonData2);
const records = [...data1, ...data2];

// Call the function to combine and replace the group
const combinedRecords = combineAndReplaceGroup(records);
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(combinedRecords);
XLSX.utils.book_append_sheet(workbook, worksheet, 'CollegeData');
const outputFile = './college-data-comb.xlsx';
XLSX.writeFile(workbook, outputFile, { bookType: 'xlsx' });

throw new Error("Stop");
const browser = await puppeteer.launch(
    { headless: false }
);
const page = await browser.newPage(

);

//await page.setViewport({ wid  th: 1920, height: 3000 });

// const browser = await puppeteer.launch(
//     { headless: false }
// );

const universityBaseUrls: string[] = [
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2095", //Ankara Bilim Lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=1117", //HBV Onlisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1117",//HBV Lisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2092",//medipol lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=2092",//medipol onlisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1011", //ankara lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=1011", //ankara lisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1100", //ybz lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=1100", //ybz lisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1041", //gazi lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=1041", //gazi lisans   
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2088", //lokman lisans
    // "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=2088", //lokman onlisans
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1084", //odtu
    // "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2021", //bilkent
    "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=2079", //yih onlisans
    "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2079", //yih onlisans
    "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2067", //ted
    "https://yokatlas.yok.gov.tr/lisans-univ.php?u=2054", //tobb
    "https://yokatlas.yok.gov.tr/lisans-univ.php?u=1048", // Hacettepe Lisans
    "https://yokatlas.yok.gov.tr/onlisans-univ.php?u=1048", // Hacettepe Onlisans
]

async function extractProgramRecords(universityBaseUrl: string): Promise<string[]> {
    await page.goto(universityBaseUrl);
    const records = await page.$$eval('a[href^="lisans.php?y="], a[href^="onlisans.php?y="]', (elements) =>
        elements.map((el) => el.href)
    );
    return records;
}

const asyncFunctions = universityBaseUrls.map((url) => () => extractProgramRecords(url));

let programRecords = await runSequentially(asyncFunctions);

async function runSequentially<T>(asyncFunctions: (() => Promise<T>)[]): Promise<T[]> {
    const results: T[] = [];
    for (const asyncFunction of asyncFunctions) {
        const result = await asyncFunction();
        results.push(result);
    }
    return results;
}

let programRecordsFlat = programRecords.flatMap((record) => record)




const asyncDetailsFunctions = programRecordsFlat.map((url) => async () => {
    try {
        return await extractProgramDetails(url)
    } catch (e) {
        console.log(e)
        return null;
    }
});

let programDetails = await runSequentially(asyncDetailsFunctions);

async function extractProgramDetails(programBaseUrl: string): Promise<ProgramDetailsRecord | null> {
    await page.goto(programBaseUrl);
    await page.waitForSelector('body > footer > div > table > tbody > tr > td:nth-child(1) > p > small > a')

    for (let popupCount = 0; popupCount < 3; popupCount++) {
        await delay(100)
        const loadAllElement = await page.waitForSelector('.label.label-success.openall')
        await loadAllElement?.click();
    }



    const collegeNameTextElement = await page.waitForSelector('#icerik_1000_1 > table:nth-child(1) > tbody > tr:nth-child(3) > td.text-center.vert-align, #icerik_3000_1 > table:nth-child(1) > tbody > tr:nth-child(3) > td.text-center.vert-align')
    const collegeName = await collegeNameTextElement?.evaluate(el => el.textContent!.trim());

    const facultyNameTextElement = await page.waitForSelector('#icerik_1000_1 > table:nth-child(1) > tbody > tr:nth-child(4) > td.text-center.vert-align, #icerik_3000_1 > table:nth-child(1) > tbody > tr:nth-child(4) > td.text-center.vert-align')
    let facultyName = await facultyNameTextElement?.evaluate(el => el.textContent!.trim());

    const programmeNameTextElement = await page.waitForSelector('#icerik_1000_1 > table:nth-child(1) > thead > tr > th > big, #icerik_3000_1 > table:nth-child(1) > thead > tr > th > big')
    let programmeName = await programmeNameTextElement?.evaluate(el => el.textContent!.trim());

    const scoreTypeTextElement = await page.waitForSelector('#icerik_1000_1 > table:nth-child(1) > tbody > tr:nth-child(5) > td.text-center.vert-align, #icerik_3000_1 > table:nth-child(1) > tbody > tr:nth-child(5) > td.text-center.vert-align')
    let scoreType = await scoreTypeTextElement?.evaluate(el => el.textContent!.trim());

    facultyName = facultyName?.replace("Fakülte / YO : ", "")
    programmeName = programmeName?.replace(/Program : \d+ - /, "");
    scoreType = scoreType?.replace("Puan Türü: ", "")

    const genderTable = await page.waitForSelector('#icerik_1010 > table > tbody, #icerik_3010 > table > tbody')
    const genderTableText = await genderTable?.evaluate(el => el.textContent!);

    const genderPattern = /(\bKız\b|\bErkek\b)/g;
    const numberPattern = /(\d+)/g;
    // Extract the genders from the table text
    const genders = genderTableText!.match(genderPattern) || [];

    // Extract the numbers from the table text
    const numbers = genderTableText!.match(numberPattern)?.map(Number) || [];

    // Assign the numbers to the respective variables based on the genders
    let numberOfFemales = 0;
    let numberOfMales = 0;

    genders.forEach((gender, index) => {
        const idx = index * 3;
        if (gender.toLowerCase() === "kız") {
            numberOfFemales = numbers[idx] || 0;
        } else if (gender.toLowerCase() === "erkek") {
            numberOfMales = numbers[idx] || 0;
        }
    });
    //#icerik_2010 > table > tbody
    let totalStudents = numberOfFemales + numberOfMales;

    const historicGenderTable = await page.waitForSelector('#icerik_2010 > table > tbody')
    const historicGenderTableText = await historicGenderTable?.evaluate(el => el.textContent!);
    // Extract the genders from the table text
    const genderPatternHistoric = /(\bKız\b|\bErkek\b|\bToplam\b)/g;

    const historicGenders = historicGenderTableText!.match(genderPatternHistoric) || [];

    // Extract the numbers from the table text
    const historicNumbers = historicGenderTableText!.match(numberPattern)?.map(Number) || [];

    // Assign the numbers to the respective variables based on the genders
    let historicNumberOfFemales = 0;
    let historicNumberOfMales = 0;
    historicGenders.forEach((gender, index) => {
        const idx = index * 3;
        if (gender.toLowerCase() === "kız") {
            historicNumberOfFemales = historicNumbers[idx] || 0;
        } else if (gender.toLowerCase() === "erkek") {
            historicNumberOfMales = historicNumbers[idx] || 0;
        }
    });

    let historicTotalStudents = historicNumberOfFemales + historicNumberOfMales;

    const originTable = await page.waitForSelector('#icerik_1020c > table > tbody, #icerik_3020c > table > tbody')
    const originTableText = await originTable?.evaluate(el => el.textContent!);

    const ankaraPattern = /Ankara\s+(\d+)/;

    const match = originTableText!.match(ankaraPattern);
    const ankaraCount = match ? parseInt(match[1]) : 0;

    return {
        collegeName: collegeName!,
        facultyName: facultyName!,
        programmeName: programmeName!,
        scoreType: scoreType!,
        femaleCount: numberOfFemales,
        maleCount: numberOfMales,
        historicFemaleCount: historicNumberOfFemales,
        historicMaleCount: historicNumberOfMales,
        historicTotalCount: historicTotalStudents,
        totalCount: totalStudents,
        localCount: ankaraCount,
        nonLocalCount: totalStudents - ankaraCount,
    }
}


programDetails = programDetails.filter(p => p !== null);

const jsonData = JSON.stringify(programDetails);

const filePath = './data-1.json';
fs.writeFile(filePath, jsonData, (err) => {
    if (err) {
        console.error('Error writing JSON file:', err);
    } else {
        console.log('JSON file saved successfully.');
    }
});

await browser.close();

function delay(time: number | undefined) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}