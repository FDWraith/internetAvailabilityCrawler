const puppeteer = require('puppeteer');
var parse = require('csv-parse');
var fs = require('fs');
var async = require("async");

const stub = "clarke"
var inputFile = stub + "In.csv"
var outputFile = stub + "OutXFINITY.csv"

let checkAddress = async(address, zip) => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.setViewport({width:1000, height:1000});
    try{
        await page.goto("https://www.xfinity.com/learn/offers?lob=internet", {timeout:60000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Page Won't Load"];
    }
    await page.waitForSelector('body > section > div > main > div.x-dealfinder-wrapper > div:nth-child(2) > div > div.x-dealfinder__inner.x-content--wide > div > div.x-flex__col-xs-12.x-flex__col-lg-3.x-filters-main > div > div.x-filters__btn.x-filters__btn--showfilters.x-flex-row.middle-xs > div > div.x-filters__btn-item__stats > div > div:nth-child(2) > button');
    await page.waitFor(5000);
    try {
        const boxThere = await page.$eval('#IPEinvL114714', el => el.innerText);
        //console.log(boxThere);
        if (boxThere !== "") {
            await page.click('#IPEinvL114714 #no');
            //await page.waitFor(600000);
        }
    } catch(err) {
        // Ignore error, that means it is fine
    }
    
    await page.click('body > section > div > main > div.x-dealfinder-wrapper > div:nth-child(2) > div > div.x-dealfinder__inner.x-content--wide > div > div.x-flex__col-xs-12.x-flex__col-lg-3.x-filters-main > div > div.x-filters__btn.x-filters__btn--showfilters.x-flex-row.middle-xs > div > div.x-filters__btn-item__stats > div > div:nth-child(2) > button');
    await page.waitForSelector('body > section.x-overlay.x-flex-row.center-xs.middle-xs._fade-in.x-overlay--localization > div.x-overlay-container.x-ui-theme--light.x-flex__col-xs-12.x-flex__col-md-10');
    await page.waitFor(2000);
    await page.click('div.x-overlay-container form fieldset div:nth-child(1) input');
    await page.type('div.x-overlay-container form fieldset div:nth-child(1) input', address, {delay:50});
    await page.click('div.x-overlay-container form fieldset div:nth-child(3)');
    await page.type('div.x-overlay-container form fieldset div:nth-child(3)', zip, {delay:50});
    await page.click('div.x-overlay-container form button');
    try {
        await page.click('div.x-overlay-container form button');
    } catch(err) {
        // second click not needed
    }

    await page.waitFor(17000);
    
    const result = await page.evaluate(() => {
        try {
            const addressFail = document.querySelector('#error-summary');
            if (addressFail.innerText !== "") {
                return ["Address Error"];
            } else {
                return ["Unknown Issue"];
            }
        } catch(err) {
            // nothing happens if no error?
            try {
                console.log("in?");
                const addressAlready = document.querySelector('header h1');
                console.log(addressAlready);
                if (addressAlready.innerText == "An XFINITY account already exists at this address") {
                    return ['Xfinity Cable Internet Available'];
                } else {
                    return ['Needs more looking into'];
                }
            } catch(err) {
                console.log('h1 not found');
                // nothign????
                return ["Testing Only"];
            }
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
                console.log(addressRow);
                const arrlen = addressRow.length;
                const zip = addressRow[arrlen-1];
                const address = addressRow.splice(0,arrlen-1).join(',');
                try {
                    checkAddress(address,  zip).then((result) => {
                        console.log(result);
                        fs.appendFile(outputFile, address + "," + zip + "," + result.join(",") + "\n", callback );
                    });
                } catch (err) {
                    console.log(err.stack);
                    fs.appendFile(outputFile, address + "," + zip + "," + "Error not caught" + "\n", callback);
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
