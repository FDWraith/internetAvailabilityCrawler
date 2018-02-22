const puppeteer = require('puppeteer');
var parse = require('csv-parse');
var fs = require('fs');
var async = require("async");

const stub = "clarke"
var inputFile = stub + "In.csv"
var outputFile = stub + "OutAC.csv"

let checkAddress = async(address, zip) => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.setViewport({width:1000, height:1000});
    try{
        await page.goto("https://www.allconnect.com/sc-internet/high-speed-internet-services.html", {timeout:60000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Page Won't Load"];
    }
    
    //await page.click("#dataCtoxInternetNav");
    
    try {
        await page.waitForSelector('div.hero__address');
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Page did not load"]
    }

    //await page.waitFor(5000);

    try{
        await page.type("form.row.ng-pristine.ng-valid div div.form-group input#street1", address);
        await page.type("form.row.ng-pristine.ng-valid div div.form-group input#cityStateZip", zip);
        await page.click("#SubmitAddress");
    } catch(err) {
        //console.log(document);
        console.log(err);
        //await page.waitFor(600000);
        // browser.close();
        await page.type("input#fullAddress", address+","+zip);
        await page.click("#SubmitSingleFieldAddress");
        //return ["Search Missing"]
    }

    await page.waitFor(5000);
    //console.log("waiting done");
    //console.log(await page.$('#error_zipCode'));
    //console.log();

    try {

        if( await page.$eval('#error_zipCode', e => e.innerText) == "Please enter valid Address." ){
            browser.close();
            return ["Invalid Address"]
        }
    } catch (err) {
        browser.close();
        return ["Error Code"];
    }

    // Try Catch Block to see if the address exists (which it should)
    try {
        await page.waitForSelector('#resultsContainer', {timeout:600000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Timed Out"];
    }

    await page.waitFor(5000);
    
    const result = await page.evaluate(() => {
        
        const resList = window.productsArray;
        console.log(resList);
        
        if( !resList ) {
            return ["Error List Not Found"];
        }
        else if ( resList == [] ) {
            return ["Results Not Found"];
        }
        else {
            var res = [];
            for( var i = 0; i < resList.length; i++ ) {
                let row = resList[i];
                let provider = row["providerName"];
                let name = row['name'];
                let dwn = "Download: " + row["internetSpeed"];
                let out = [];
                out.push(provider);
                out.push(name);
                out.push(dwn);
                res.push(out.join(" - "));
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
                console.log(addressRow);
                const arrlen = addressRow.length;
                const address = addressRow.splice(0,arrlen-1).join(",");
                const zip = addressRow[0];
                try {
                    checkAddress(address, zip).then((result) => {
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
