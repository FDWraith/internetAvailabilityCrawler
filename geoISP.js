const puppeteer = require('puppeteer');
var parse = require('csv-parse');
var fs = require('fs');
var async = require("async");

var stub = "clarke"
var inputFile = stub + "In.csv"
var outputFile = stub + "OutGEO.csv"

let checkAddress = async(address) => {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    await page.setViewport({width:1000, height:1000});
    try{
        await page.goto("https://geoisp.com/", {timeout:60000});
    } catch(err) {
        console.log(err);
        browser.close();
        return ["Page Error"]
    }
    await page.waitForSelector("#div_container");
    await page.type('#div_container > form > input[type="text"]', address);
    await page.click('#div_container > form > button');
    try {
        await page.waitForSelector('#breadcrumb');
    } catch (err) {
        console.log(err.stack);
        browser.close();
        return ["Timed Out"]
    }
    await page.waitFor(2000);
    const result = await page.evaluate(() => {
        const divClear = document.querySelector('#div_clear');
        if( divClear ) {
            return ["Results Not Found"];
        } else {
            const resTable = document.querySelector('#null > tbody > tr:nth-child(3) > td > table > tbody');
            if( !resTable ) {
                return ["Error Table"];
            }
            else if( resTable == [] ) {
                return ["Results Not Found"];
            }
            else {
                const resList = resTable.querySelectorAll('tr.d0');
                var res = [];
                for(var i = 0; i < resList.length; i++) {
                    let row = resList[i];
                    let rowList = row.children;
                    let title = rowList[0].title;
                    let rowName = title.substring( title.indexOf("Provider Name:") + 14, title.indexOf("Holding Company Name:")).replace(",", " ");
                    let rowTech = rowList[1].innerText;
                    let maxDwn = "Max Download: " + rowList[2].innerText;
                    let maxUp = "Max Upload: " + rowList[3].innerText;
                    let rowRes = [];
                    rowRes.push(rowName);
                    rowRes.push(rowTech);
                    rowRes.push(maxDwn);
                    rowRes.push(maxUp);
                        
                    res.push(rowRes.join(" - "));
                }
                if(res != [] && res.length != 0){
                    return res;
                } else {
                    return ["Results Not Found"];
                }
                
            }
        }
        
    })

    await page.close();
    browser.close();
    if( result == [] ) {
        return ["Results Empty"]
    } else {
        return result;
    }
    
}

function scrapeAddressData() {
    var addresses = [];
    fs.createReadStream(inputFile)
        .pipe(parse({delimiter: ":"}))
        .on('data', function(csvrow) {
            addresses.push((String)(csvrow));
        })
        .on('end', async() => {

            function parseAddress(address, callback) {
                try {
                    checkAddress(address).then((result) => {
                        console.log(result);
                        fs.appendFile(outputFile, address + "," + result.join(",") + "\n", callback );
                    });
                } catch (err) {
                    console.log(err.stack);
                }
            }

            var queue = async.queue(parseAddress, 5);
            queue.drain = function() {
                console.log("done");
            }

            queue.push(addresses);
        })
}

scrapeAddressData();
