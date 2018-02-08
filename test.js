const puppeteer = require('puppeteer');
const Page = require('puppeteer/lib/Page');
var parse = require('csv-parse');
var fs = require('fs');
var async = require("async");

const stub = "clarke"
const inputFile = stub + "In.csv"
const outputFile = stub  +  "OutAC.csv"

let newPageWithNewContext = async(browser) => {
    const {browserContextId} = await browser._connection.send('Target.createBrowserContext');
    const {targetId} = await browser._connection.send('Target.createTarget', {url: 'about:blank', browserContextId});
    const client = await browser._connection.createSession(targetId);
    const page = await Page.create(client, browser._ignoreHTTPSErrors, browser._screenshotTaskQueue);
    page.browserContextId = browserContextId;
    return page;
    
}

async function closePage(browser, page) {
    await console.log(page.browserContextId);
    if (await page.browserContextId != undefined) {
        await browser._connection.send('Target.disposeBrowserContext', {browserContextId: page.browserContextId});        
    }
    await page.close(); 
}


let scrape = async (address, zip) => {
    //const browser = await browser;
    //console.log(browser);
    const browser = await puppeteer.launch({headless: true, timeout:0});
    const page = await browser.newPage();//newPageWithNewContext(browser);
    await page.setDefaultNavigationTimeout(1000000);
    await page.setViewport({width: 1000, height: 500})
    try {
        await page.goto('https://www.allconnect.com/',{timeout:0});
    } catch (err) {
        console.log(error);
        browser.close();
        //closePage(browser, page);
        //page.close();
        return ["Page Did Not Load"];
    }
    
    await page.click("#dataCtoxInternetNav",{timeout:0});
    await page.waitFor(2000, {timeout:0});
    //await page.screenshot({path:'temp.png'});
    try{
        await page.type("form.row.ng-pristine.ng-valid div div.form-group input#street1", address);
        await page.type("form.row.ng-pristine.ng-valid div div.form-group input#cityStateZip", zip);
        await page.click("form.row.ng-pristine.ng-valid div div.form-group button#SubmitAddress");
    } catch(err) {
        console.log(err.stack);
        browser.close();
        //closePage(browser, page);
        //page.close();
        return ["Search Missing"];
    } 
    console.log("does this work");
    await page.waitForSelector('div.alert-box');
    //await page.screenshot({path:address+".png"});

    if( await page.$('#error_zipCode').innerText == "Please enter valid Address.") {
        await page.screenshot({path:(address+".png")});
        browser.close();
        //closePage(browser,page);
        //page.close();
        return ["Invalid Address"];
    }else {
        console.log("valid");
        /*
          if( await page.$('div.alert-box.alert.round') && await page.$('div.alert-box.alert', {timeout:600000}).innerText !== undefined) {
          await console.log(page.$('div.alert-box.alert.round').innerText);
          closePage(browser,page);
          return ["Invalid Address"];
          }*/
        try {
            await page.waitForSelector('#resultsContainer', {timeout:600000});
        } catch(err) {
            console.log(err.stack);
            browser.close();
            //closePage(browser, page);
            //page.close();
            return ["Timed Out"];
        }
        console.log("passed");
        await page.waitFor(4000);
        const result = await page.evaluate(() => {
            
            const container = document.getElementById('resultsContainer');
            if( !container ) {
                return ["None"];
            } else {
                
                console.log(container);
                let children = container.getElementsByClassName('result-row');
                let temp = children[0];
                var info = [];

                console.log(children.length);
                for( var i = 0; i < children.length; i++ ) {
                    let currentValue = children[i];
                    var childInfo = [];
                    try {
                        childInfo.push(currentValue.querySelector('#nameCol').querySelector('h3.ng-binding').innerText);
                        childInfo.push(currentValue.querySelector('#termsCol').querySelector('span.ng-binding').innerText);
                        info.push(childInfo);
                    } catch (err) {
                        console.log(err.stack);
                        browser.close();
                        //closePage(browser, page);
                        //page.close();
                        return ["Internet Results Missing"];
                    }
                }
                if (info == []) {
                    return ["None"];
                } else {
                    return info;
                }    
                
            }
        });
        console.log(result);
        browser.close();
        //closePage(browser, page);
        //page.close();
        return result;   
    }
    
    
     
};




function writeExit(address, zip, callback) {

    try {
        scrape(address,zip).then((value) => {
            var temp = [];
            temp = temp.concat(address.split(","));
            temp.push(zip);
            for( var i = 0; i < value.length; i++ ){
                temp = temp.concat(value[i]);
            }
            return callback(temp); 
        });
    } catch(err) {
        console.log(err.stack);
        return callback([address.split(",").concat([zip]).concat(["Error"])]);
    }
}


function newScrapper() {
    
    var csvData=[];
    fs.createReadStream(inputFile)
        .pipe(parse({delimiter: ':'}))
        .on('data', function(csvrow) {
            csvData.push((String)(csvrow).split(','));                
        })
        .on('end',async() => {
            // const puppeteer = require('puppeteer');

            function runOnData(csvrow, callback) {
                console.log(csvrow);
                let arrlen = csvrow.length;
                let zip = csvrow[arrlen-1];
                let address = csvrow.splice(0,arrlen-1).join(",");
                writeExit(address, zip, function(exitData) {
                    fs.appendFile(outputFile,exitData.join(",")+"\n", callback);
                });  
            }
            
            var queue = async.queue(runOnData, 3);
            
            queue.drain = function() {
                console.log('done');
            }
            
            queue.push(csvData);
            
        });

};

newScrapper();
//browser.close();
