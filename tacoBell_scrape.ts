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


async function enter_area_code(driver: any ,area_code:string) {
    const searchInput = await driver.wait(until.elementLocated(By.id('find-search-input-text')));
    await driver.wait(until.elementIsVisible(searchInput));
    await searchInput.sendKeys(area_code);
    await driver.findElement(By.id('find-search-input-submit')).click();  

    // After enter area code click first location
    // Assuming you have a driver instance from Selenium WebDriver
    const orderButton = await driver.wait(until.elementLocated(By.xpath("//button[text()='Order here']")), 10000);
    await driver.wait(until.elementIsVisible(orderButton));
    await orderButton.click();
};


async function check_pop_up(driver:any) {
    const pop_up = await driver.findElement(By.id('generic-modal'));
    const inner = await pop_up.getAttribute('innerHTML');
    if(pop_up){
        console.log(inner);
        await driver.wait(until.elementLocated(By.css('.modal-header button.close')))
        const close_button = await driver.findElement(By.css('.modal-header button.close'));
        await driver.wait(until.elementIsVisible(close_button))
        console.log(close_button)
        await close_button.click();
        
    }
};


async function get_menu_options_href(driver: any): Promise<string[]> {
    let menu_options_href: string[] = [];
    try{
        await driver.wait(until.elementLocated(By.xpath('//a[@tabindex="1"]')), 5000);
        const menu_options_div = await driver.findElements(By.xpath('//a[@tabindex="1"]'));
        for(let i = 0; i < menu_options_div.length; i++){
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
            // styles_product-image-container__SUjfH
            let items = await driver.wait(until.elementsLocated(By.className('styles_card__1DpUa styles_product-card__1-cAT')));
            for(let i = 0; i < items.length; i++){
                const item_name = await items[i].findElement(By.tagName('h4')).getText();
                const price_and_cal = await items[i].findElement(By.tagName('p')).getText();
                const [price, calories] = price_and_cal.split('|').map((s:string) => s.trim());
                item_info.push([2, item_name, price, calories])
                console.log([2, item_name, price, calories])
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
        await driver.get('https://www.tacobell.com/food');
        let hrefs = await get_menu_options_href(driver);
        let items = await extract_item_info(driver, hrefs);
        await append_to_csv(items);

    } finally {
        // Quit the WebDriver session
        if(driver){
            await driver.quit();
        };
    }
}

scrape_tacoBell();
