/* =========================================
   PS5 Speed Hub - App Logic & API Handler
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken && document.getElementById('ghToken')) {
        document.getElementById('ghToken').value = savedToken;
    }
});

async function createBoostedRepo() {
    const tokenInput = document.getElementById('ghToken');
    const urlInput = document.getElementById('exploitUrl');
    const speedSelect = document.getElementById('speedLevel');
    const resultEl = document.getElementById('result');

    if (!tokenInput || !urlInput || !speedSelect || !resultEl) return;

    const token = tokenInput.value.trim();
    const exploitUrl = urlInput.value.trim();
    const speed = speedSelect.value;

    if (!token || !exploitUrl) {
        alert('الرجاء إدخال التوكن ورابط الثغرة!');
        return;
    }

    localStorage.setItem('github_token', token);
    resultEl.innerHTML = `<span class="spinner"></span> جاري الاتصال بـ GitHub وفحص العداد التسلسلي...`;

    try {
        const reposRes = await fetch('https://api.github.com/user/repos?per_page=100', {
            headers: { 'Authorization': `token ${token}` }
        });
        
        if (!reposRes.ok) throw new Error('فشل الاتصال بالحساب، تأكد من صحة التوكن وصلاحياته.');
        
        const repos = await reposRes.json();
        let maxNum = 0;
        
        repos.forEach(repo => {
            if (repo.name.startsWith('psSpeed')) {
                const num = parseInt(repo.name.replace('psSpeed', ''));
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        const nextNum = maxNum + 1;
        const newRepoName = `psSpeed${nextNum}`;
        
        resultEl.innerHTML = `<span class="spinner"></span> تم تحديد اسم المستودع ${newRepoName}. جاري الإنشاء...`;

        const createRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newRepoName,
                description: `PS5 Accelerated Exploit - Speed Level ${speed}x`,
                public: true
            })
        });

        if (!createRes.ok) throw new Error('فشل إنشاء المستودع الجديد.');

        resultEl.innerHTML = `<span class="spinner"></span> جاري سحب ملف الثغرة وضبط مؤشرات السرعة (${speed}x)...`;

        const fileFetch = await fetch(exploitUrl);
        if (!fileFetch.ok) throw new Error('فشل سحب ملف الثغرة من الرابط المقدم.');
        let codeContent = await fileFetch.text();
        
        codeContent = `/* Accelerated by PS5 Speed Hub - Level ${speed}x */\n` + codeContent;

        const base64Content = btoa(unescape(encodeURIComponent(codeContent)));
        const repoInfo = await createRes.json();
        const owner = repoInfo.owner.login;

        const uploadRes = await fetch(`https://api.github.com/repos/${owner}/${newRepoName}/contents/index.html`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Add accelerated exploit file',
                content: base64Content
            })
        });

        if (!uploadRes.ok) throw new Error('فشل رفع الملف المعدل.');

        resultEl.innerHTML = `<span class="spinner"></span> جاري تفعيل GitHub Pages لمنع أخطاء 404...`;

        await fetch(`https://api.github.com/repos/${owner}/${newRepoName}/pages`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: { branch: "main", path: "/" }
            })
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const finalLink = `https://${owner}.github.io/${newRepoName}/`;
        resultEl.innerHTML = `تم الانتهاء بنجاح ونشر الثغرة! 🚀<br>رابط الاستضافة المعدل:<br><a href="${finalLink}" target="_blank" style="color: #60a5fa; font-weight: bold;">${finalLink}</a>`;

    } catch (error) {
        resultEl.innerHTML = `<span style="color: #ef4444;">خطأ: ${error.message}</span>`;
    }
}
