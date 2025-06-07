const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { start } = require('repl');

module.exports = async (page, setting) => {
    const timeout = 5 * 60 * 1000;

    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('div.x19h7ccj > div.x1yztbdb span > span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mount_0_0_wG\\"]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div/div[4]/div[2]/div/div[2]/div[1]/div/div/div/div[2]/div/div/div/div/div[1]/div[2]/span/span)'),
            targetPage.locator(':scope >>> div.x19h7ccj > div.x1yztbdb span > span'),
            targetPage.locator('::-p-text(Bộ lọc)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 6.14862060546875,
                y: 9.47296142578125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Edit ending date year. Current selection is none)'),
            targetPage.locator('#«r80»'),
            targetPage.locator('::-p-xpath(//*[@id=\\"«r80»\\"])'),
            targetPage.locator(':scope >>> #«r80»')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 48.86485290527344,
                y: 22.62158203125,
              },
            });
    }
    
    const currentYear = parseInt(new Date().getFullYear());
    const yearRange = parseInt(setting.yearRange) || currentYear;
    const startYear = (currentYear - yearRange) + 1;
    for (let i = 0; i < startYear; i++) {
        const targetPage = page;

        await targetPage.keyboard.down('ArrowDown');
        await targetPage.keyboard.up('ArrowDown');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.down('Enter');
    }
    {
        const targetPage = page;
        await targetPage.keyboard.up('Enter');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('div.x1iorvi4 div:nth-of-type(2) > div > div > div > div:nth-of-type(2) i'),
            targetPage.locator('::-p-xpath(//*[@id=\\"«r83»\\"]/div[1]/i)'),
            targetPage.locator(':scope >>> div.x1iorvi4 div:nth-of-type(2) > div > div > div > div:nth-of-type(2) i')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 3.554046630859375,
                y: 9.62158203125,
              },
            });
    }

    let startMonth = parseInt(setting.monthRange) || 0;
    if (startMonth < 1 || startMonth > 12) startMonth = setting.dayRange ? parseInt(new Date().getMonth()) + 1 : 0;
    for (let i = 0; i < startMonth; i++) {
        const targetPage = page;

        await targetPage.keyboard.down('ArrowDown');
        await targetPage.keyboard.up('ArrowDown');
    }
    if (startMonth > 0) {
        const targetPage = page;
        await targetPage.keyboard.down('Enter');
        await targetPage.keyboard.up('Enter');
        
        await puppeteer.Locator.race([
            targetPage.locator('div:nth-of-type(4) div:nth-of-type(2) > div > div > div > div.x4k7w5x span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"«r86»\\"]/span)'),
            targetPage.locator(':scope >>> div:nth-of-type(4) div:nth-of-type(2) > div > div > div > div.x4k7w5x span'),
            targetPage.locator('::-p-text(Ngày)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 36.054046630859375,
                y: 11.12158203125,
              },
            });
    }

    let startDay = parseInt(setting.dayRange) || 0;
    if (startDay < 1 || startDay > 31) startDay = 0;
    for (let i = 0; i < startDay; i++) {
        const targetPage = page;

        await targetPage.keyboard.down('ArrowDown');
        await targetPage.keyboard.up('ArrowDown');
    }
    if (startDay > 0) {
        const targetPage = page;
        await targetPage.keyboard.down('Enter');
        await targetPage.keyboard.up('Enter');
    }

    {
        const targetPage = page;
        targetPage.evaluate(() => {
            document.querySelector('div[aria-label="Xong"][role="button"][tabindex="0"]').click();
        });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
}
