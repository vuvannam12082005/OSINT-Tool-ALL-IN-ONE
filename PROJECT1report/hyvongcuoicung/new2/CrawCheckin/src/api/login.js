const puppeteer = require('puppeteer');
const faCode = require('authenticator');
const fs = require('fs');
const path = require('path');

module.exports = async (email, pass, tfa) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ],
        defaultViewport: null
    });
    const page = await browser.newPage();
    const timeout = 5 * 60 * 1000;
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 1091,
            height: 816
        })
    }
    {
        const targetPage = page;
        await targetPage.goto('https://www.facebook.com/');
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Email address or phone number)'),
            targetPage.locator("[data-testid='royal-email']"),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"royal-email\\"])'),
            targetPage.locator(":scope >>> [data-testid='royal-email']"),
            targetPage.locator("#email")
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 48.1351318359375,
                y: 25,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Email address or phone number)'),
            targetPage.locator("[data-testid='royal-email']"),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"royal-email\\"])'),
            targetPage.locator(":scope >>> [data-testid='royal-email']")
        ])
            .setTimeout(timeout)
            .fill(email);
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Password)'),
            targetPage.locator("[data-testid='royal-pass']"),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"royal-pass\\"])'),
            targetPage.locator(":scope >>> [data-testid='royal-pass']")
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 54.4053955078125,
                y: 12.4053955078125,
              },
            });
    }
    {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Password)'),
            targetPage.locator("[data-testid='royal-pass']"),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"royal-pass\\"])'),
            targetPage.locator(":scope >>> [data-testid='royal-pass']")
        ])
            .setTimeout(timeout)
            .fill(pass);
    }
    {
        const targetPage = page;
        const promises = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        }
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Log in[role=\\"button\\"])'),
            targetPage.locator("[data-testid='royal-login-button']"),
            targetPage.locator('::-p-xpath(//*[@data-testid=\\"royal-login-button\\"])'),
            targetPage.locator(":scope >>> [data-testid='royal-login-button']")
        ])
            .setTimeout(timeout)
            .on('action', () => startWaitingForEvents())
            .click({
              offset: {
                x: 170.270263671875,
                y: 26.581085205078125,
              },
            });
        await Promise.all(promises);
    }
    {
        await new Promise(resolve => {
            const checkUrl = () => {
                if (!page.url().includes('two_step_verification/authentication')) {
                    resolve();
                } else {
                    setTimeout(checkUrl, 1000);
                }
            };
            checkUrl();
        });
    }
    try {
        const targetPage = page;
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Mã)'),
            targetPage.locator('#«r3»'),
            targetPage.locator('::-p-xpath(//*[@id=\\"«r3»\\"])'),
            targetPage.locator(':scope >>> #«r3»')
        ])
            .setTimeout(5000)
            .fill(faCode.generateToken(tfa).replaceAll(' ', ''));
    } catch (_) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const currentUrl = page.url();
        if (currentUrl.includes('two_step_verification/two_factor')) {
            const targetPage = page;
            await puppeteer.Locator.race([
                targetPage.locator('::-p-aria(Mã)'),
                targetPage.locator('#«r3»'),
                targetPage.locator('::-p-xpath(//*[@id=\\"«r3»\\"])'),
                targetPage.locator(':scope >>> #«r3»')
            ])
                .setTimeout(timeout*2)
                .fill(faCode.generateToken(tfa).replaceAll(' ', ''));
        }
        
    }
    {
        const targetPage = page;
        const promises = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        }
        await puppeteer.Locator.race([
            targetPage.locator('div.xod5an3 span > span'),
            targetPage.locator('::-p-xpath(//*[@id=\\"mount_0_0_H6\\"]/div/div[1]/div/div[2]/div/div/div[1]/div[1]/div/div[1]/div/div/div/div/div/div/div[3]/div/div[1]/div/div/div/div[1]/div/span/span)'),
            targetPage.locator(':scope >>> div.xod5an3 span > span'),
            targetPage.locator('::-p-text(Tiếp tục)')
        ])
            .setTimeout(timeout)
            .on('action', () => startWaitingForEvents())
            .click({
              offset: {
                x: 33.3648681640625,
                y: 17.10809326171875,
              },
            });
        await Promise.all(promises);
    }
    // {
    //     const targetPage = page;
    //     const promises = [];
    //     const startWaitingForEvents = () => {
    //         promises.push(targetPage.waitForNavigation());
    //     }
    //     await puppeteer.Locator.race([
    //         targetPage.locator('div.xod5an3 span > span'),
    //         targetPage.locator('::-p-xpath(//*[@id=\\"mount_0_0_9p\\"]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[1]/div/div/div/div/div[3]/div[1]/div/div/div/div[1]/div/span/span)'),
    //         targetPage.locator(':scope >>> div.xod5an3 span > span')
    //     ])
    //         .setTimeout(timeout)
    //         .on('action', () => startWaitingForEvents())
    //         .click({
    //           offset: {
    //             x: 61.189178466796875,
    //             y: 13.04052734375,
    //           },
    //         });
    //     await Promise.all(promises);
    // }
    // {
    //     const targetPage = page;
    //     await puppeteer.Locator.race([
    //         targetPage.locator('div.xsag5q8 > div > div:nth-of-type(1) > div.x1i10hfl span > span'),
    //         targetPage.locator('::-p-xpath(//*[@id=\\"mount_0_0_Gr\\"]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[2]/div/div/div/div[2]/div/div[1]/div/div/div/div/div[3]/div/div[1]/div[1]/div/div[1]/div/span/span)'),
    //         targetPage.locator(':scope >>> div.xsag5q8 > div > div:nth-of-type(1) > div.x1i10hfl span > span')
    //     ])
    //         .setTimeout(timeout)
    //         .click({
    //           offset: {
    //             x: 11.24322509765625,
    //             y: 12.54052734375,
    //           },
    //         });
    // }

    {
        const targetPage = page;
        const cookies = await targetPage.cookies();
        const cookiesPath = path.join(__dirname, '..', 'data', 'cookies.json');
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        console.log('Cookies saved to:', cookiesPath);
    }

    await browser.close();
}