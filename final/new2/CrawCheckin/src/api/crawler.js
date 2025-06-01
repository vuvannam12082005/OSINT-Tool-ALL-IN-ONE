const puppeteer = require('puppeteer');
const faCode = require('authenticator');
const fs = require('fs');
const path = require('path');
const { type } = require('os');

module.exports = async (cookies, setting) => {
    const result = [];
    if (!cookies || cookies.length == 0) {
        throw new Error('Cookies are required');
    }
    console.log('Crawling posts, please wait... (It will take a long time)');
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            "--disable-notifications"
        ],
        defaultViewport: null
    });
    const page = await browser.newPage();
    // Set light mode
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36');

    await page.setCookie(...cookies);
    const timeout = 10 * 60 * 1000;
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 800,
            height: 1460
        })
    }
    {
        const targetPage = page;
        await targetPage.goto(setting.link);
    }
    if (setting.yearRange || setting.monthRange || setting.dayRange) {
        await require(path.join(__dirname, 'filter.js'))(page, setting);
    }
    {
        const targetPage = page;
        await targetPage.waitForSelector('div[role="main"]');
        await new Promise(resolve => setTimeout(resolve, 15000));
    }
    {
        const targetPage = page;
        await targetPage.evaluate(() => {
            scrollTo(0, 10000);
        });
    }
    {
        const targetPage = page;
        await new Promise(resolve => setTimeout(resolve, 15000));
    }
    {
        const targetPage = page;
        
        try {
            await targetPage.waitForSelector('div[role="main"] > :nth-of-type(4) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2)  > :nth-of-type(2)  > :nth-of-type(1)', { timeout: 10000 });
        } catch (_) {
            console.error('Error: Unable to find the posts container. Please check the link or try again later.');
            await browser.close();
            return result;
        }
        const posts = await targetPage.evaluate(async (setting) => {
            let postsContainer = document.querySelector('div[role="main"]').childNodes[5].childNodes[2].childNodes[0].childNodes[1].childNodes[12];
            let results = [];
            let scrollHeight = 0;
            scrollTo(0, 1000);

            // Loop through the post elements
            while (postsContainer.childNodes.length > 0 && results.length < setting.postLimit && scrollHeight != scrollY) {
                scrollHeight = scrollY;
                results = [];
                scrollTo(0, 100000);
                await new Promise(resolve => setTimeout(resolve, 8000));
                try {
                    postsContainer = document.querySelector('div[role="main"]').childNodes[5].childNodes[2].childNodes[0].childNodes[1].childNodes[12];
                } catch (_) {
                    scrollHeight = 0;
                    continue;
                }
                let j = 1;
                for (let i = 0; i < postsContainer.childNodes.length; i++) {
                    try {
                        const post = postsContainer.childNodes[i];
                        if (post.nodeType != 1) continue;

                        let res = {
                            textContent: `${post.textContent.replaceAll('FacebookFacebook', '').trim()}`,
                            index: j++,
                            link: post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[12].querySelector('a') ? post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[12].querySelector('a').href : null,
                            linkTag: post.querySelectorAll('a')[2] ? post.querySelectorAll('a')[2].href : null,
                            images: Array.from(post.querySelectorAll('img')).map(img => { if (img.src.startsWith("http")) return img.src }),
                            videos: Array.from(post.querySelectorAll('video')).map(video => { if (video.src.startsWith("http")) return video.src }),
                            type: 'checkin'
                        }

                        if (res.linkTag && res.linkTag.includes(res.link.split('?')[0])) {
                            res.type = 'post';
                        } else {
                            res.nameLocal = post.childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[12].querySelectorAll('a')[2].innerText
                        }
                        results.push(res);
                    } catch (e) {
                        console.error(`Error processing post ${i + 1}:`, e);
                        // results.push(`Post ${i + 1}: Error - ${e.message}`);
                        results.push({
                            textContent: `Not found post ${i}`,
                            index: --j,
                            link: null,
                            linkTag: null,
                            images: [],
                            videos: [],
                            type: 'error'
                        });
                    }
                }
            }
            return results;
        }, setting);
        console.log(`Found ${posts.length} posts.`);

        // Log all posts

        let res = [];
        console.log('Getting pfbid and time for each post, please wait... (It will take a long time)');
        for (let post of posts) {
            if (setting.postType && post.type != setting.postType) continue;

            const url = await getUrl(page, post.index);
            post.link = url.pfbid;
            post.time = url.time;

            result.push(post);
        }
        console.log(`Found ${result.length} posts with bfbid and time.`);
        console.log('Crawling completed.');

        // Tạo tên file với timestamp
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const fileName = `check_in_data_${hours}h_${minutes}_${day}_${month}_${year}.json`;
        
        // Lưu kết quả vào file
        const outputPath = path.join(__dirname, '..', 'data', fileName);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Data saved to: ${outputPath}`);
    }
    {
        const targetPage = page;
        await targetPage.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });

        const cookies = await targetPage.cookies();
        const cookiesPath = path.join(__dirname, '..', 'data', 'cookies.json');
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    }
    await browser.close();
    return result;
}

async function getUrl(page, index) {
    let time = "";

    try {
        await page.locator(`div[role="main"] > :nth-of-type(4) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2)  > :nth-of-type(2) > :nth-of-type(${index}) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(13) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2)  > :nth-of-type(1) a`).hover();
        await new Promise(resolve => setTimeout(resolve, 2000));
        time = await page.evaluate(() => {
            return document.querySelectorAll(".__fb-dark-mode")[0].innerText;
        });
        await page.locator(`div[role="main"] > :nth-of-type(4) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2)  > :nth-of-type(2) > :nth-of-type(${index}) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1)  > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(13) > :nth-of-type(1) > :nth-of-type(1) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2) > :nth-of-type(1) > :nth-of-type(2)  > :nth-of-type(1) a`).click();
    } catch (e) { }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pfbid = page.url();
    let url = page.url();
    while (url.includes('/posts/')) {
        await page.goBack();
        await new Promise(resolve => setTimeout(resolve, 1000));
        url = page.url();
    }

    return { pfbid, time };
}