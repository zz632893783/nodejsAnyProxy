// B 站硬核会员自动答题脚本
// 脚本启动命令
// anyproxy --intercept --rule bilibiliWenxin.js -i --ignore-unauthorized-ssl
const axios = require('axios');
const puppeteer = require('puppeteer');

let ready = false;
let browser = null;
let page = null;

// token 缓存
let tokenCache = '';
// 调用申请到的应用 key （需要自行去百度获取）去获取 token
const getToken = (apiKey = '1eYMV9g2AdVFOz7Gaa0ykbj5', SecretKey = 'AtU4CUxfYlIYUUiaoxSEVsktkjy7yZmk') => {
    return new Promise(resolve => {
        if (tokenCache) {
            return resolve(tokenCache);
        }
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${ apiKey }&client_secret=${ SecretKey }`;
        axios.post(url, {}).then(response => {
            resolve(tokenCache = response.data.access_token);
        });
    })
};
// 发送信息
const sendMessage = (content  = '', role = 'user', token) => {
    return new Promise(resolve => {
        const requestBody = {
            messages: [
                { role, content }
            ]
        };
        const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${ token }`
        axios.post(url, requestBody).then(response => resolve(response?.data?.result))
    });
};
// 导出代理
module.exports = {
    // 监听请求
    *beforeSendResponse(requestDetail, responseDetail) {
        // 匹配硬核会员题目的接口
        if (/https?:\/\/api.bilibili.com\/x\/senior\/v1\/question/.test(requestDetail.url)) {
            (async () => {
                // 创建窗口
                if (!ready) {
                    browser = await puppeteer.launch({ headless: false });
                    page = await browser.newPage();
                    await page.setViewport({ width: 720, height: 720 });
                    await page.goto('about:blank');
                    ready = true;
                }
                await page.evaluate(() => {
                    const style = document.createElement('style');
                    style.innerHTML = `
                        .item {
                            border: 1px solid red;
                            padding: '12px 24px';
                        }
                    `;
                    document.head.appendChild(style);
                });
                // 解析题干
                const jsonData = JSON.parse(responseDetail.response.body.toString());
                const question = jsonData.data.question;
                const option = jsonData.data.answers.map((n, i) => `${ String.fromCharCode(65 + i) }.${ n.ans_text }`).join(' ');
                // 获取 token
                const token = await getToken();
                // 调取文心一言接口答题
                const answer = await sendMessage(`${ question } ${ option }`, 'user', token);
                await page.evaluate(async (config) => {
                    const container = document.createElement('div');
                    container.className = 'item';
                    container.innerHTML = `
                        <h4>${ config.question }</h4>
                        <p>${ config.option }</p>
                        <p>${ config.answer }</p>
                    `;
                    document.body.appendChild(container);
                }, { question, option, answer });
            })();
        }
    }
};