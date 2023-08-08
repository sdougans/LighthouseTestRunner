const fs = require('fs')
const lighthouse = require('./node_modules/lighthouse/core/index.cjs')
const chromeLauncher = require('chrome-launcher')

var array = fs.readFileSync('URLs.csv').toString().split('\n')

let result = []
result.push(', URL, Mobile_Performance, Mobile_A11y, Mobile_BestPractices, Mobile_SEO, Desktop_Performance, ' +
 + 'Desktop_A11y, Desktop_BestPractices, Desktop_SEO')

 ;(async () => {
    const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-extensions']
    })

    const options = {
        logLevel: 'info',
        output: 'html',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
    }

    if(!fs.existsSync('./reports')){
        fs.mkdirSync('reports')
    }

    var timestamp = getFiletimestamp()

    for(let i in array){
        for(let x=0; x<2; x++){
            if(x===0) options.strategy = 'mobile'
            else options.strategy = 'desktop'

            var runnerResult = await lighthouse(array[i], options)

            var cleanUrl = runnerResult.lhr.mainDocumentUrl.replace(/\.|\/|:/gm, '-').replace(/--/gm, '');

            var report = runnerResult.report
            fs.writeFileSync(`./reports/html-${timestamp}-${cleanUrl}-${options.strategy}.html`)
        }
    }


    await chrome.kill()
 })()

 const getFiletimestamp = () => {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getUTCDate();
    var hour = date.getHours();
    var min = date.getMinutes();
    var sec = date.getSeconds();
    return `${year}-${month}-${day}-${hour}-${min}-${sec}`
 }