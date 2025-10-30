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

    // Check if command line arguments are provided
    const args = process.argv.slice(2);
    let userInput;

    if (args.length > 0) {
        // Use command line arguments
        console.log('Sử dụng tham số từ command line...');
        const userIdOrName = args[0];
        const postLimit = args[1] && args[1] !== '' ? parseInt(args[1]) : 100;
        const yearRange = args[2] && args[2] !== '' ? parseInt(args[2]) : null;
        const monthRange = args[3] && args[3] !== '' ? parseInt(args[3]) : null;
        const dayRange = args[4] && args[4] !== '' ? parseInt(args[4]) : null;

        console.log(`Tham số: username=${userIdOrName}, posts=${postLimit}, year=${yearRange}, month=${monthRange}, day=${dayRange}`);

        userInput = {
            userIdOrName,
            postLimit,
            yearRange,
            monthRange,
            dayRange
        };
    } else {
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
            let userIdOrName = '';
            while (!userIdOrName) {
                userIdOrName = await prompt('Nhập username/uid (bắt buộc): ');
                if (!userIdOrName) {
                console.log('Bạn phải nhập username/uid!');
                }
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
        userInput = await getUserInput();
    }

    const data = await require(path.join(__dirname, 'src', 'api', 'crawler.js'))(cookies, {
        ...userInput,
        link: `https://www.facebook.com/${userInput.userIdOrName}`,
        postType: 'checkin'
    });

    console.log('Hoàn thành crawler!');
    
    // Exit the process
    process.exit(0);
})().catch(error => {
    console.error('Lỗi crawler:', error);
    process.exit(1);
});