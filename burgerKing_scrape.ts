import { Builder, By, Key, WebElement, until, Capabilities, Button } from 'selenium-webdriver';
import 'chromedriver'; // Import the Chrome driver
import * as fs from 'fs';


async function InitializeDriver() {
    // Create Chrome options with fullscreen capability
    const chromeOptions = new Capabilities({
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--start-maximized'] // Option to start the browser in maximized mode
        }
    });

    // Initialize the WebDriver with Chrome options
    return await new Builder().withCapabilities(chromeOptions).build();
}
async function append_to_csv(items_info: (number | string)[][]){
    const file_path = './database_append.csv';
    for(const item_info of items_info){
        const csvData = item_info.join(',') + '\n';
        fs.appendFile(file_path, csvData,(err) => {
        if(err){
            console.error('Error appending data: ' , err);
        }
        console.log('Data appended to file!');
        });
    };
};


async function enter_adress(driver: any , address:string) {
    try{
        const searchInput = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Your Address"]')));
        await driver.wait(until.elementIsVisible(searchInput));
        await searchInput.sendKeys(address);
        const location = await driver.wait(until.elementLocated(By.className('css-175oi2r r-1otgn73 r-14lw9ot r-1jie2fr r-rs99b7 r-1loqt21 r-h3s6tt r-1777fci r-1mdbw0j r-1qhn6m8 r-i023vh r-wk8lta r-13qz1uu')))
        await location.click()

        // After enter area code click first location
        const first_location = await driver.wait(until.elementLocated(By.className('css-175oi2r r-1loqt21 r-1otgn73 r-eqz5dr r-1l7z4oj r-1qhn6m8 r-i023vh r-95jzfe')));
        await first_location.click()
       
        const orderButton = await driver.wait(until.elementLocated(By.className('css-175oi2r r-1otgn73 r-1awozwy r-m0iagf r-sdzlij r-1u8cipt r-1loqt21 r-18u37iz r-1777fci r-10paoce r-xd6kpl r-1qhn6m8 r-i023vh r-tskmnb r-13qz1uu')), 10000);
        await driver.wait(until.elementIsVisible(orderButton));
        await orderButton.click();
    }catch(error){
        console.log('!!', error, '!!');
    }finally{
        return
    }
};


async function get_menu_options_href(driver: any): Promise<string[]> {
    let menu_options_href: string[] = [];
    try{
        await driver.wait(until.elementLocated(By.xpath('//h2[text()="Digital Exclusives"]')))
        await driver.wait(until.elementsLocated(By.xpath('//a[@role="link"]')))
        const menu_options_div = await driver.findElements(By.xpath('//a[@role="link"]'));
        for(let i = 5; i < menu_options_div.length-4; i++){
            menu_options_href.push(await menu_options_div[i].getAttribute('href'));
        }
    }catch(error){
        console.log("There was an error", error)
    }finally{
        return menu_options_href
    }
};

async function extract_item_info(driver:any, hrefs: string[]): Promise<(number | string)[][]> {
    let item_info: (number | string)[][] = []
    try{
        for(let i = 0; i < hrefs.length; i++){
            await driver.get(hrefs[i]);
            await driver.sleep(3000)
            let inner_h2 = await driver.wait(until.elementsLocated(By.tagName('h2')));
            console.log(inner_h2.length);
            for(let i = 1; i < inner_h2.length-1; i++){
                let outer_div_item = await inner_h2[i].findElement(By.xpath('./ancestor::div[1]'));
                const item_name = await outer_div_item.findElement(By.tagName('h2')).getText();
                // There are two elems in the thing bellow
                const price_and_cal = await outer_div_item.findElements(By.xpath('.//div[@dir="auto"]'));
                console.log(`${item_name}, ${await price_and_cal[0].getText()},${await price_and_cal[1].getText()}`)
                item_info.push([3,item_name,await price_and_cal[0].getText(),await price_and_cal[1].getText()])
                // const [price, calories] = price_and_cal.split('|').map((s:string) => s.trim());
                // item_info.push([2, item_name, price, calories])
                // console.log([2, item_name, price, calories])
            }
        };
    }catch(error){
        console.log("!!", error, "!!")
    }finally{
        return item_info
    }
};



async function scrape_tacoBell() {
    let driver;
    try {
        // Initialize the WebDriver
        driver = await InitializeDriver();
        // Navigate to a website
        await driver.get('https://www.bk.com/store-locator');
        await enter_adress(driver, '10000 Lee Street, Pineville, NC, USA');
        const items_hrefs = await get_menu_options_href(driver);
        console.log(items_hrefs);
        console.log("Made it to the extration")
        const items_info = await extract_item_info(driver, items_hrefs);
        await append_to_csv(items_info);

    } finally {
        // Quit the WebDriver session
        if(driver){
            await driver.quit();
        };
    }
}

scrape_tacoBell();



