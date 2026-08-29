const https = require('https');

const token = process.env.GH_TOKEN;
const exploitUrl = process.env.EXPLOIT_URL;
const speed = process.env.SPEED_LEVEL;

if (!token || !exploitUrl || !speed) {
    console.error('Missing environment variables.');
    process.exit(1);
}

function githubRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const dataString = data ? JSON.stringify(data) : '';
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'PS5-Speed-Hub-Bot',
                'Accept': 'application/vnd.github+json',
                ...(data && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataString) })
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(responseBody ? JSON.parse(responseBody) : {});
                } else {
                    reject(new Error(`GitHub API Error: ${res.statusCode} - ${responseBody}`));
                }
            });
        });

        req.on('error', err => reject(err));
        if (dataString) req.write(dataString);
        req.end();
    });
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', err => reject(err));
    });
}

async function main() {
    try {
        console.log('Fetching user repositories...');
        const user = await githubRequest('/user');
        const owner = user.login;
        const repos = await githubRequest('/user/repos?per_page=100');
        
        let maxNum = 0;
        repos.forEach(repo => {
            if (repo.name.startsWith('psSpeed')) {
                const num = parseInt(repo.name.replace('psSpeed', ''));
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });

        const nextRepoName = `psSpeed${maxNum + 1}`;
        console.log(`Creating new repository: ${nextRepoName}`);

        await githubRequest('/user/repos', 'POST', {
            name: nextRepoName,
            description: `PS5 Accelerated Exploit - Speed Level ${speed}x`,
            public: true
        });

        console.log('Fetching single-file exploit content...');
        let rawCode = await fetchUrl(exploitUrl);
        
        // حقن وسم التسريع وهيكلة الملف الموحد
        const optimizedContent = `<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>PS5 Accelerated Exploit [Level ${speed}x]</title>
    <style>
        /* Speed Hub Optimization Inject */
        body { background-color: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px; }
        .speed-badge { position: fixed; top: 10px; right: 10px; background: #3b82f6; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="speed-badge">Speed Mode: ${speed}x 🚀</div>
    ${rawCode.includes('<html') ? rawCode : `<script>${rawCode}</script>`}
</body>
</html>`;

        const encodedContent = Buffer.from(optimizedContent).toString('base64');

        console.log('Uploading clean index.html to new repository...');
        await githubRequest(`/repos/${owner}/${nextRepoName}/contents/index.html`, 'PUT', {
            message: 'Deploy single-file optimized exploit',
            content: encodedContent
        });

        console.log('Enabling GitHub Pages...');
        await githubRequest(`/repos/${owner}/${nextRepoName}/pages`, 'POST', {
            source: { branch: "main", path: "/" }
        });

        console.log(`Successfully deployed: https://${owner}.github.io/${nextRepoName}/`);
    } catch (error) {
        console.error('Error during build process:', error.message);
        process.exit(1);
    }
}

main();
