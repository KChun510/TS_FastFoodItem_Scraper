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


async function append_to_csv(items_info: string[][]){
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

async function extract_item_info(driver:any): Promise<string[][]> {
    let items_info: string[][] = []

    await driver.wait(until.elementsLocated(By.css('.titles-container')), 4000);
    const productElements = await driver.findElements(By.css('.titles-container'));
    for(const productElement of productElements){
        const titleElement = await productElement.findElement(By.css('.product-item-title'));
        const title = await titleElement.getText();

        // Extract the price and calories
        const subTitleElement = await productElement.findElement(By.css('.sub-title'));
        const subTitle = await subTitleElement.getText();

        // Split the subtitle text to get price and calories
        const [price, calories] = subTitle.split('|').map((s:string) => s.trim());
        items_info.push([1,title, price, calories])

        // Output the results
        console.log('Title:', title);
        console.log('Price:', price);
        console.log('Calories:', calories);
    }
    return items_info
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


async function scrape_wendys() {
    let driver;
    try {
        // Initialize the WebDriver
        driver = await InitializeDriver();
        // Navigate to a website
        await driver.get('https://order.wendys.com/location?lang=en_US');
        
        // Search the location
        await enter_area_code(driver ,'94602');

        // select the first option that comes up
        const first_option = await driver.wait(until.elementLocated(By.xpath("//button[@data-testid='category-item-button']")));
        await first_option.click()

        // Find all the divs that contain buttons, but wait till there visible
        await driver.wait(until.elementsLocated(By.className('categories-list')), 10000);
        let menu_button_divs = await driver.findElements(By.className('categories-list'));
        
        // Loop through the above divs, and extract the button
        let buttons = async (): Promise<WebElement[]> => {
            let button_array: WebElement[] = []
            menu_button_divs.forEach((element: WebElement) => {
                button_array.push(element.findElement(By.tagName('button')));
            });
            return button_array
        }

        // Assign the buttons to an array
        let buttonElements: WebElement[] = await buttons();

        const delayBetweenClicks = 1000;
        for(let i = 1; i < buttonElements.length; i++){
            await buttonElements[i].click()
            await append_to_csv(await extract_item_info(driver))
            await new Promise(resolve => setTimeout(resolve, delayBetweenClicks))
        };

    } finally {
        // Quit the WebDriver session
        if(driver){
            await driver.quit();
        };
    }
}

scrape_wendys();
