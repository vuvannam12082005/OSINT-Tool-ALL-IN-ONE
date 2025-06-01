require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check cookie file is exits
const cookieFilePath = path.join(__dirname, 'src', 'data', 'cookies.json');

(async () => {
    if (!fs.existsSync(cookieFilePath)) {
        const email = process.env.FACEBOOK_EMAIL;
        const password = process.env.FACEBOOK_PASSWORD;
        const tfa = process.env.TWO_FA;

        await require(path.join(__dirname, 'src', 'api', 'login.js'))(email, password, tfa);
    }

    // Read cookies from file
    const cookies = JSON.parse(fs.readFileSync(cookieFilePath, 'utf8'));

    // Collect user inputs
    const getUserInput = async () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Function to prompt for input
        const prompt = (question) => {
            return new Promise((resolve) => {
                rl.question(question, (answer) => {
                    resolve(answer.trim());
                });
            });
        };

        // Get username from command line arguments
        const userIdOrName = process.argv[2] || '';
        if (!userIdOrName) {
            console.log('Vui lòng nhập username/uid!');
            process.exit(1);
        }

        const postLimit = await prompt('Nhập số bài muốn tìm check-in(cuộn qua n bài): ');
        const yearRange = await prompt('Nhập khoảng năm: ');
        const monthRange = await prompt('Nhập khoảng tháng: ');
        const dayRange = await prompt('Nhập khoảng ngày: ');

        rl.close();

        return {
            userIdOrName,
            postLimit: postLimit ? parseInt(postLimit) : 100,
            yearRange: yearRange ? parseInt(yearRange) : null,
            monthRange: monthRange ? parseInt(monthRange) : null,
            dayRange: dayRange ? parseInt(dayRange) : null
        };
    };

    // Get user input
    const userInput = await getUserInput();

    const data = await require(path.join(__dirname, 'src', 'api', 'crawler.js'))(cookies, {
        ...userInput,
        link: `https://www.facebook.com/${userInput.userIdOrName}`,
        postType: 'checkin'
    });

    // Exit the process
    process.exit(0);
})()