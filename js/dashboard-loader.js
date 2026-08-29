/* =========================================
   PS5 Speed Hub - Dashboard Loader
   ========================================= */

document.addEventListener('DOMContentLoaded', async () => {
    const repoListEl = document.getElementById('repoList');
    const token = localStorage.getItem('github_token');

    if (!token) {
        repoListEl.innerHTML = `<p style="color: #ef4444;">لم يتم العثور على التوكن. يرجى العودة للصفحة الرئيسية وإدخاله لتتمكن من رؤية الأرشيف.</p>`;
        return;
    }

    try {
        const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=created', {
            headers: { 'Authorization': `token ${token}` }
        });

        if (!res.ok) throw new Error('فشل جلب المستودعات، تحقق من صلاحيات التوكن.');

        const repos = await res.json();
        const speedRepos = repos.filter(repo => repo.name.startsWith('psSpeed'));

        if (speedRepos.length === 0) {
            repoListEl.innerHTML = `<p style="color: #94a3b8;">لا توجد أي مستودعات معدلة حتى الآن. قم بإنشاء أول رابط من الصفحة الرئيسية!</p>`;
            return;
        }

        let html = '<ul style="list-style: none; padding: 0;">';
        speedRepos.forEach(repo => {
            const liveUrl = `https://${repo.owner.login}.github.io/${repo.name}/`;
            html += `
                <li style="background: #0f172a; margin-bottom: 10px; padding: 15px; border-radius: 8px; border: 1px solid #475569; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <strong style="color: #3b82f6; font-size: 16px;">${repo.name}</strong>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${repo.description || 'بدون وصف'}</div>
                    </div>
                    <a href="${liveUrl}" target="_blank" style="background: #2563eb; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 5px;">زيارة الرابط 🚀</a>
                </li>
            `;
        });
        html += '</ul>';

        repoListEl.innerHTML = html;

    } catch (error) {
        repoListEl.innerHTML = `<p style="color: #ef4444;">خطأ: ${error.message}</p>`;

       <script src="js/dashboard-loader.js"></script>

    }
});
