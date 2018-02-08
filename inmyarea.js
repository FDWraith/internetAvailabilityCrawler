const puppeteer = require('puppeteer');
var parse = require('csv-parse');
var fs = require('fs');
var async = require("async");

const stub = "clarke"
var inputFile = stub + "In.csv"
var outputFile = stub + "OutIMA.csv"

let checkAddress = async(address, city, state, zip) => {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    await page.setViewport({width:1000, height:1000});
    try{
        await page.goto("https://inmyarea.com/", {timeout:60000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Page Won't Load"];
    }
    await page.waitForSelector('#addresscheckavailability > div > div');
    await page.click('#enter-address-address');
    await page.type('#enter-address-address', address);
    await page.type('#enter-address-city', city);
    await page.type('#enter-address-state', state);
    await page.type('#enter-address-zip',zip);
    await page.click('#enter-btn-refine');

    // Try Catch Block to see if the address exists (which it should)
    try {
        await page.waitForSelector('#residential', {timeout:600000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Timed Out"];
    }

    await page.waitFor(5000);
    
    const result = await page.evaluate(() => {
        const resList = document.querySelectorAll('#residential > div > div.internet');
        if( !resList ) {
            return ["Error List Not Found"];
        }
        else if ( resList == [] ) {
            return ["Results Not Found"];
        }
        else {
            var res = [];
            var currentProvider = "None";
            var currentServiceType = "None";
            for( var index = 0; index < resList.length; index++ ) {
                let item = resList[index];
                // if it's a provider
                if( item.className.indexOf("provider") != -1 ) {
                    try {
                        currentProvider = item.querySelector('div:nth-child(5) > div > p.provider_paragraph.provider_short').innerText;
                        currentServiceType = item.querySelector('div.row.dark.samecolor.darker > div.col-xs-2.col-sm-2.col-md-2.text-left').innerText;
                    } catch (err) {
                        console.log(err);
                        console.log("provider error");
                        return res;
                    }
                } else {
                    try {
                        let dwn = "Download: " + item.querySelector('div.plan-top.row > div:nth-child(3) > div.download-speed').innerText;
                        let up = "Upload: " + item.querySelector('div.plan-top.row > div:nth-child(3) > div.upload-speed').innerText;
                        let provider = "Provider: " + currentProvider;
                        let service = currentServiceType;
                        let rowRes = [];
                        rowRes.push(provider);
                        rowRes.push(service);
                        rowRes.push(dwn);
                        rowRes.push(up);
                        
                        res.push(rowRes.join(" - "));
                    } catch (err) {
                        console.log(err);
                        console.log("item error");
                        res.push(["Error"])
                    }
                }
            }
            return res;
        }        
    })

    await page.close();
    browser.close();
    return result;
}

function scrapeAddressData() {
    var addresses = [];
    fs.createReadStream(inputFile)
        .pipe(parse({delimiter: ":"}))
        .on('data', function(csvrow) {
            addresses.push((String)(csvrow).split(","));
        })
        .on('end', async() => {

            function parseAddress(addressRow, callback) {
                const address = addressRow[0];
                const city = addressRow[1];
                const state = addressRow[2];
                const zip = addressRow[3];
                try {
                    checkAddress(address, city, state, zip).then((result) => {
                        console.log(result);
                        fs.appendFile(outputFile, addressRow.join(",") + "," + result.join(",") + "\n", callback );
                    });
                } catch (err) {
                    console.log(err.stack);
                }
            }

            var queue = async.queue(parseAddress, 3);
            queue.drain = function() {
                console.log("done");
            }

            queue.push(addresses);
        })
}

scrapeAddressData();
