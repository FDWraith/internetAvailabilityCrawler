const puppeteer = require('puppeteer');
const async = require('async');
const fs = require('fs');
const parse = require('csv-parse');

let checkZip = async(zip) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1000, height: 500});
    await page.goto("https://www.highspeedinternet.com/va", {timeout:0});
    await page.waitForSelector('form.zip-finder', {timeout:0});
    await page.type('form.zip-finder input', zip);
    await page.click('form.zip-finder button.button');
    await page.waitForSelector('div.container.cards', {timeout:0});
    await page.waitFor(2000);
    const result = await page.evaluate(() => {
        
        var resultList = document.querySelector('div.columns.small-12.large-8.left-col > div.container.cards.tabs-panel.show-tabs-panel.has-sorted');
        if (!resultList) {
            resultList = document.querySelector('#residential-providers'); 
        }
        let children = resultList.children;
        //console.log(children);
        var res = [];
        for( var index = 0; index < children.length; index++ ){
            //console.log(children[index]);
            res.push(children[index].querySelector('.top > .name').innerText.substring(3));
        }
        return res;
    });
    await page.close();
    browser.close();
    return result;
}


function scrapeZipData() {
    var zipCodes = [];
    fs.createReadStream('zipInput.csv')
        .pipe(parse({delimiter: ":"}))
        .on('data', function(csvrow) {
            zipCodes.push((String)(csvrow[0]));
        })
        .on('end', async() => {
            console.log(zipCodes);
                        
            function parseZip(zip, callback) {
                try {
                    checkZip(zip).then((result) => {
                        fs.appendFile("zipOutput.csv", zip + "," + result.join(",") + "\n", callback);                
                    });
                } catch (err) {
                    console.log(err.stack);
                }
            }

            var queue = async.queue(parseZip, 1);
            queue.drain = function() {
                console.log('done');
            }

            queue.push(zipCodes);
            
        });
}


scrapeZipData();
