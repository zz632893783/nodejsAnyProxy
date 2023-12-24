// B 站硬核会员自动答题脚本
// 全局安装 anyproxy
// 项目安装 puppeteer
// 脚本启动命令
// anyproxy --intercept --rule bilibili.js -i --ignore-unauthorized-ssl
const puppeteer = require('puppeteer');
let ready = false;
let browser = null;
let page = null;

// (async () => {
//     await page.evaluate(async (config) => {
//         document.body.style.backgroundColor = 'green';
//     });
// })();
// const send = async msg => {
//     const result = await model.generateContent([msg]);
//     const response = await result.response;
//     return response.text();
// };

// send('讲个冷笑话').then(res => {
//     console.log(res)
// })
module.exports = {
    *beforeSendResponse(requestDetail, responseDetail) {
        // if (/https?:\/\/api.bilibili.com\/x\/senior\/v1\/question/.test(requestDetail.url)) {
        //     const jsonData = JSON.parse(responseDetail.response.body.toString());
        //     const question = jsonData.data.question;
        //     const answers = jsonData.data.answers.map((n, i) => `${ String.fromCharCode(65 + i) }.${ n.ans_text }`);
        //     const sendContent = `${ question } ${ answers.join(' ') }`;
        //     send(sendContent).then(res => {
        //         console.log('sendContent;;;;', res);
        //     });
        // }
        if (/https?:\/\/api.uomg.com\/api\/rand.qinghua/.test(requestDetail.url)) {
            (async () => {
                if (!ready) {
                    browser = await puppeteer.launch({ headless: false });
                    page = await browser.newPage();
                    await page.goto('https://gemini.zzgpt.asia/');
                    ready = true;
                }
                const receivedData = JSON.parse(responseDetail.response.body.toString());
                await page.evaluate(async (config) => {
                    const textarea = document.querySelector('textarea');
                    const sendBtn = textarea.nextElementSibling;
                    textarea.value = config.content;
                    setTimeout(() => sendBtn.click(), 500);
                }, receivedData);
            })();
        }
    }
};