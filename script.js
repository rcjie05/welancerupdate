// =============================================
// FINAL ULTIMATE WeLancer script.js (2025 PRO) - FULL & WORKING
// Photo Proof + Manager Approval + Instant Bonus + ZERO BUGS
// =============================================

let role = '', userId = 0;
let tasks = [], projects = [], users = [];

// ======================== API HELPER — FINAL SILENT & CLEAN VERSION ========================
async function api(endpoint, data = null, isFormData = false) {
    try {
        const response = await fetch(`api/${endpoint}`, {
            method: data ? 'POST' : 'GET',
            credentials: 'include',
            headers: isFormData ? {} : { 'Content-Type': 'application/json' },
            body: isFormData ? data : (data ? JSON.stringify(data) : null)
        });

        const text = await response.text();

        // SILENTLY detect if PHP file was opened directly → redirect instead of alert spam
        if (text.trim().startsWith('<?php') || text.includes('<!DOCTYPE') || text.includes('<html')) {
            if (!window.location.href.includes('/welancer/')) {
                alert("Please open the app via:\nhttp://localhost/welancer/\n\nNever open PHP files directly!");
                window.location.href = "http://localhost/welancer/";
            }
            return { success: false, error: "Wrong access" };
        }

        // Try to parse JSON, if fails → probably not API response
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn("Non-JSON response from API:", endpoint);
            return { success: false, error: "Invalid response" };
        }

    } catch (err) {
        console.error("API Error:", err);
        return { success: false, error: "Network or server error" };
    }
}

// ======================== ADMIN FUNCTIONS ========================
async function changeUserRole(userIdToChange, newRole) {
    if (userIdToChange == userId) return alert("You cannot change your own role!");
    if (confirm(`Change role to "${newRole.toUpperCase()}"?`)) {
        try {
            await api('change_user_role.php', { user_id: userIdToChange, role: newRole });
            alert('Role updated!');
            await loadAllData();
            renderPage('users');
        } catch (err) { alert('Error: ' + err.message); }
    }
}

async function deleteUser(userIdToDelete) {
    if (userIdToDelete == userId) return alert("You cannot delete yourself!");
    if (confirm('PERMANENTLY delete this user?')) {
        try {
            await api('delete_user.php', { user_id: userIdToDelete });
            alert('User deleted!');
            await loadAllData();
            renderPage('users');
        } catch (err) { alert('Error: ' + err.message); }
    }
}

function showAddUser() {
    openModal('Add New User', `
        <input type="text" id="newName" placeholder="Full Name" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <input type="text" id="newUsername" placeholder="Username" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <input type="password" id="newPassword" placeholder="Password (min 6 chars)" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <select id="newRole" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
        </select>
    `, async () => {
        const name = document.getElementById('newName').value.trim();
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;
        if (!name || !username || password.length < 6) return alert('Fill all fields correctly');
        try {
            await api('add_user.php', { name, username, password, role });
            alert('User added!');
            await loadAllData();
            renderPage('users');
        } catch (err) { alert('Error: ' + err.message); }
    });
}

// ======================== ADD PROJECT — FINAL 100% WORKING ========================
function showAddProject() {
    if (!['admin', 'hr', 'manager'].includes(role)) return alert('Access denied');

    const managers = users.filter(u => u.role === 'manager');
    // If no managers exist and you're not a manager → block (unless you're creating as yourself)
    if (managers.length === 0 && role !== 'manager') return alert('No managers available');

    openModal('Create New Project', `
        <input type="text" id="projName" placeholder="Project Name" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <select id="projManager" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="" ${role === 'manager' ? '' : 'selected'} disabled>Select Manager (Optional)</option>
            ${managers.map(m => `<option value="${m.id}" ${m.id === userId ? 'selected' : ''}>${m.name} ${m.id === userId ? '(You)' : ''}</option>`).join('')}
            ${role === 'manager' ? `<option value="${userId}" selected>You (${users.find(u=>u.id===userId)?.name || 'Me'})</option>` : ''}
        </select>
        <input type="number" id="totalPoints" placeholder="Total Project Points" value="100" min="10" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <input type="number" id="taskQuantity" placeholder="How many tasks?" value="5" min="1" max="50" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <div style="margin:20px 0;padding:15px;background:#eaf4ff;border-radius:10px;text-align:center;font-size:1.1em;">
            <strong>Each task = <span id="pointsPerTask" style="color:#e74c3c;font-size:1.5em;font-weight:bold;">20</span> points</strong>
        </div>
    `, async () => {
        const name = document.getElementById('projName').value.trim();
        const selectedManager = document.getElementById('projManager').value;
        const totalPoints = parseInt(document.getElementById('totalPoints').value) || 100;
        const taskQuantity = parseInt(document.getElementById('taskQuantity').value) || 5;

        if (!name || totalPoints < 10 || taskQuantity < 1) {
            return alert('Please fill all fields correctly');
        }

        // CRITICAL FIX: Only send manager_id if a valid ID is selected
        const payload = {
            name,
            points: totalPoints,
            task_quantity: taskQuantity,
            points_per_task: Math.floor(totalPoints / taskQuantity)
        };

        // Only add manager_id if a real manager was selected (not empty string)
        if (selectedManager && selectedManager !== '' && selectedManager !== 'null') {
            payload.manager_id = parseInt(selectedManager);
        }
        // If no manager selected → backend will auto-assign current user (from your PHP fix)

        try {
    const res = await api('add_project.php', payload);
    if (res.success) {
        alert(`Project "${name}" created successfully!\n${taskQuantity} tasks × ${Math.floor(totalPoints / taskQuantity)} pts each`);
        
        // AUTO REFRESH DATA + REDIRECT TO PROJECTS PAGE
        await loadAllData();
        renderPage('projects');  // This auto-switches tab
        document.getElementById('app-modal')?.remove();

        // Optional: Highlight the new project (feels premium)
        setTimeout(() => {
            const newProjectCard = document.querySelector('#main-page-content .card > div > div:last-child');
            if (newProjectCard) {
                newProjectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newProjectCard.style.boxShadow = '0 0 30px #3498db';
                newProjectCard.style.transition = 'all 0.6s';
                setTimeout(() => newProjectCard.style.boxShadow = '', 3000);
            }
        }, 500);

    } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
    }
} catch (err) {
    alert('Error: ' + err.message);
}
    });

    // Live points per task calculator
    const update = () => {
        const t = parseInt(document.getElementById('totalPoints').value) || 100;
        const q = parseInt(document.getElementById('taskQuantity').value) || 1;
        document.getElementById('pointsPerTask').textContent = Math.floor(t / q);
    };
    document.getElementById('totalPoints').addEventListener('input', update);
    document.getElementById('taskQuantity').addEventListener('input', update);
    update();
}

// ======================== MANAGER + ADMIN: ASSIGN TASKS ========================
function showAddTask() {
    // FIXED: Admins, HR, Managers can assign tasks
    if (!['admin', 'hr', 'manager'].includes(role)) return alert('Access denied');

    // For admin/hr: show ALL projects
    // For manager: show only his projects
    const myProjects = (role === 'manager') 
        ? projects.filter(p => parseInt(p.manager_id) === userId)
        : projects;  // Admin/HR see all

    if (myProjects.length === 0) return alert('No projects available to assign tasks.');

    openModal('Assign Tasks to Members', `
        <select id="selectProject" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;font-size:1em;">
            <option value="" disabled selected>Select project</option>
            ${myProjects.map(p => {
                const created = tasks.filter(t => t.project_id == p.id).length;
                const total = p.task_quantity;
                const remaining = total - created;
                return `<option value="${p.id}">
                    ${p.name} — ${remaining > 0 ? remaining + ' slots left' : 'Full'} (${created}/${total})
                </option>`;
            }).join('')}
        </select>

        <div id="taskArea" style="display:none;margin-top:20px;">
            <div style="background:#e8f5ff;padding:18px;border-radius:12px;margin-bottom:20px;">
                <strong id="projectInfo"></strong><br>
                <span style="color:#27ae60;font-weight:bold;">Each task = <span id="pointsDisplay">0</span> pts</span>
            </div>
            <div id="taskForms"></div>
            <button id="saveTasksBtn" style="margin-top:30px;padding:16px 60px;background:#27ae60;color:white;border:none;border-radius:12px;font-weight:bold;font-size:1.2em;">
                Save & Assign Tasks
            </button>
        </div>
    `, () => {});

    const select = document.getElementById('selectProject');
    const area = document.getElementById('taskArea');
    const forms = document.getElementById('taskForms');
    const info = document.getElementById('projectInfo');
    const pointsDisplay = document.getElementById('pointsDisplay');

    select.addEventListener('change', () => {
        const projectId = select.value;
        if (!projectId) { area.style.display = 'none'; return; }

        const project = projects.find(p => p.id == projectId);
        const existing = tasks.filter(t => t.project_id == projectId).length;
        const slotsLeft = project.task_quantity - existing;

        if (slotsLeft <= 0) {
            alert('All tasks already assigned!');
            area.style.display = 'none';
            return;
        }

        info.textContent = `Assign ${slotsLeft} task(s) for "${project.name}"`;
        pointsDisplay.textContent = project.points_per_task;
        forms.innerHTML = '';

        for (let i = 1; i <= slotsLeft; i++) {
            const taskNum = existing + i;
            forms.innerHTML += `
                <div style="background:#f8f9fa;padding:22px;margin:18px 0;border-radius:14px;border-left:6px solid #3498db;">
                    <h4 style="margin:0 0 15px;color:#2c3e50;">Task ${taskNum}</h4>
                    <input type="text" id="title_${taskNum}" placeholder="Task title" style="width:100%;padding:14px;margin:8px 0;border-radius:10px;">
                    <select id="member_${taskNum}" style="width:100%;padding:14px;margin:8px 0;border-radius:10px;">
                        <option value="" disabled selected>Assign to member</option>
                        ${users.filter(u => u.role === 'member').map(u => 
                            `<option value="${u.id}">${u.name} (@${u.username})</option>`
                        ).join('')}
                    </select>
                </div>`;
        }

        area.style.display = 'block';

        document.getElementById('saveTasksBtn').onclick = async () => {
            const tasksToSave = [];
            for (let i = 1; i <= slotsLeft; i++) {
                const num = existing + i;
                const title = document.getElementById(`title_${num}`)?.value.trim();
                const memberId = document.getElementById(`member_${num}`)?.value;
                if (!title || !memberId) {
                    alert(`Task ${num}: Fill title and member!`);
                    return;
                }
                tasksToSave.push({ title, project_id: projectId, user_id: memberId });
            }

            try {
                for (const task of tasksToSave) {
                    await api('add_task.php', task);
                }
                alert(`Success! ${slotsLeft} tasks assigned.`);
                await loadAllData();
                renderPage('dashboard');
                document.getElementById('app-modal')?.remove();
            } catch (err) {
                alert('Error: ' + err.message);
            }
        };
    });
}


// ======================== MEMBER: SUBMIT PROOF (100% FIXED!) ========================
function openProofUpload(taskId) {
    const task = tasks.find(t => t.id == taskId);
    const project = projects.find(p => p.id == task.project_id);

    openModal('Submit Proof of Completion', `
        <div style="text-align:center;padding:20px;background:#f0f8ff;border-radius:12px;">
            <h4>${task.title}</h4>
            <p><strong>Project:</strong> ${project.name} • <strong>Reward:</strong> ${task.points} points</p>
        </div>
        <div style="margin:20px 0;padding:20px;background:#fff8e1;border:2px dashed #f39c12;border-radius:12px;text-align:center;">
            <input type="file" id="proofFile" accept="image/*" style="display:none;">
            <button onclick="document.getElementById('proofFile').click()" style="padding:14px 32px;background:#f39c12;color:white;border:none;border-radius:10px;font-weight:bold;">
                Choose Photo / Screenshot
            </button>
            <p style="margin-top:10px;color:#e67e22;">Supported: JPG, PNG, GIF</p>
            <div id="preview" style="margin-top:15px;"></div>
        </div>
    `, async () => {
        const file = document.getElementById('proofFile').files[0];
        if (!file) return alert('Please select a file');

        const formData = new FormData();
        formData.append('proof', file);
        formData.append('task_id', taskId);

        try {
            const res = await api('submit_proof.php', formData, true); // CORRECT URL + FormData
            if (res.success) {
                alert('Proof submitted! Waiting for manager approval...');
                await loadAllData();
                renderPage('tasks');
                document.getElementById('app-modal')?.remove();
            } else {
                alert('Upload failed: ' + (res.error || 'Unknown error'));
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    });

    document.getElementById('proofFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('preview').innerHTML = 
                    `<img src="${e.target.result}" style="max-width:100%;max-height:300px;border-radius:10px;border:3px solid #27ae60;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ======================== MANAGER: APPROVE / REJECT ========================
async function approveTask(taskId, approve) {
    if (!confirm(approve ? 'Approve this task? Points will be awarded!' : 'Reject this submission?')) return;

    try {
        const res = await api('approve_task.php', { task_id: taskId, approve: approve ? 1 : 0 });
        
        if (res.success) {
            alert(approve 
                ? `Task Approved! +${res.points_awarded || 0} pts awarded!` 
                : 'Task Rejected');
            await loadAllData();  // This forces refresh
            renderPage('tasks');
        } else {
            alert('Error: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}
// HR: Final Project Approval
async function approveProject(projectId) {
    if (!confirm('Approve this project as COMPLETED?\n\nManager: +500 pts\nMembers: +300 pts each')) return;

    const res = await api('approve_project.php', { project_id: projectId });
    if (res.success) {
        alert(`PROJECT APPROVED!\n${res.message}\n\nMembers rewarded: ${res.members_count}`);
        await loadAllData();
        renderPage('projects');
    } else {
        alert('Error: ' + (res.error || 'Unknown'));
    }
}

// ======================== MODAL ========================
function openModal(title, html, onSave = () => {}) {
    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
        <div style="background:white;padding:40px;border-radius:20px;width:90%;max-width:560px;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
            <h3 style="margin:0 0 25px;color:#2c3e50;font-size:1.6em;">${title}</h3>
            ${html}
            <div style="margin-top:30px;text-align:right;">
                <button onclick="document.getElementById('app-modal')?.remove()" style="padding:12px 24px;background:#ddd;border:none;border-radius:10px;margin-right:12px;font-weight:bold;">Cancel</button>
                <button id="modalSave" style="padding:14px 32px;background:#3498db;color:white;border:none;border-radius:10px;font-weight:bold;">Submit</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('modalSave').onclick = async () => {
        await onSave();
        modal.remove();
    };
}

// ======================== LOGIN & DATA ========================
document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    try {
        const res = await api('login.php', { username, password });
        if (res.success) {
            role = res.user.role;
            userId = res.user.id;
            document.querySelector('.login-container')?.remove();
            document.getElementById('floating-bg')?.remove();
            await loadAllData();
            renderFullApp();
        } else alert('Wrong username or password');
    } catch (err) { alert('Login failed — Is XAMPP running?'); }
});

async function loadAllData() {
    try {
        [tasks, projects, users] = await Promise.all([
            api('tasks.php'),
            api('projects.php'),
            api('users.php')
        ]);
    } catch (e) { console.error(e); alert('Failed to load data'); }
}

// ======================== MAIN APP & RENDER (FULL) ========================
function renderFullApp() {
    const u = users.find(x => x.id === userId) || {};
    document.body.innerHTML = `
    <div id="app-root" style="display:flex;min-height:100vh;font-family:'Poppins',sans-serif;background:#f4f6f9;">
        
        <!-- SIDEBAR WITH EPIC LOGO — FIXED & PERFECT -->
        <aside id="sidebar" style="width:280px;background:#2c3e50;color:white;padding:30px;box-shadow:6px 0 25px rgba(0,0,0,0.15);position:relative;overflow:hidden;display:flex;flex-direction:column;">
            
            <!-- PERFECTLY FITTING WeLancer LOGO – CLEAN & ELEGANT -->
<div style="text-align:center;margin-bottom:40px;padding:18px 0;border-bottom:2px solid rgba(0,212,255,0.15);">
    <img src="images/Welancer2.png" 
         alt="WeLancer Logo" 
         style="width:145px;height:auto;filter:drop-shadow(0 0 18px #00d4ff);animation:glow 4s ease-in-out infinite alternate;"
         onerror="this.src='https://i.imgur.com/8iK8z7P.png'">
    
    <h2 style="margin:14px 0 0;font-size:1.85em;background:linear-gradient(135deg,#00ffff,#8b5cf6,#ff00ff);
               -webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;letter-spacing:2px;line-height:1.2;">
        WeLancer
    </h2>
    
    <p style="margin:6px 0 0;font-size:0.82em;color:#a0d8ff;letter-spacing:1.8px;font-weight:400;opacity:0.9;">
        WE FIND THE BETTER FOR YOU
    </p>
</div>

            <!-- NAVIGATION -->
            <nav style="font-size:1.15em;flex:1;">
                <a href="#" class="active" data-page="dashboard">Dashboard</a>
                <a href="#" data-page="projects">Projects ${['admin','hr'].includes(role)?'<span style="float:right;">+</span>':''}</a>
                <a href="#" data-page="tasks">Tasks ${['admin','hr','manager'].includes(role)?'<span style="float:right;">+</span>':''}</a>
                ${role==='admin'?'<a href="#" data-page="users">Users <span style="float:right;">+</span></a>':''}
                <a href="#" data-page="leaderboard">Leaderboard</a>
                <a href="#" data-page="profile">Profile</a>
            </nav>

            
        </aside>

        <!-- MAIN CONTENT -->
        <div id="main-container" style="flex:1;padding:40px;">
            <header style="background:rgba(205, 212, 223, 0.92);backdrop-filter:blur(20px);padding:28px 40px;border-radius:28px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(99,102,241,0.25);box-shadow:0 20px 60px rgba(0,0,0,0.6);">
    
    <h1 id="page-title" style="margin:0;font-size:2.8rem;font-weight:900;background:linear-gradient(135deg,#a78bfa,#ec4899,#f59e0b);-webkit-background-clip:text;color:transparent;letter-spacing:-1.2px;">
        Dashboard
    </h1>

    <!-- ONLY PHOTO + NAME + ROLE (EXACTLY LIKE YOUR DESIGN) -->
    <div style="display:flex;align-items:center;gap:18px;">
        <img src="${u.photo ? u.photo + '?v=' + Date.now() : 'https://via.placeholder.com/80x80/6366f1/ffffff?text=' + (u.name?.[0]||'U')}" 
             style="width:62px;height:62px;border-radius:50%;object-fit:cover;border:4px solid #6366f1;box-shadow:0 0 30px rgba(99,102,241,0.6);">

        <div style="text-align:left;">
            <div style="font-size:0.95rem;color:rgba(1, 5, 12, 0.64);letter-spacing:0.5px;">Logged as</div>
            <div style="font-size:1.55rem;color:rgba(1, 5, 12, 0.64);font-weight:800;letter-spacing:-0.5px;margin:4px 0;">
                ${u.name || 'User'}
            </div>
            <span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:7px 20px;border-radius:30px;font-size:0.88rem;font-weight:bold;letter-spacing:1px;box-shadow:0 6px 20px rgba(99,102,241,0.4);">
                ${(u.role || 'member').toUpperCase()}
            </span>
        </div>

        <button onclick="if(confirm('Logout now? 👋')) window.location.href='logout.php'"
        style="margin-left:30px;padding:16px 40px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:20px;font-weight:700;font-size:1.15rem;font-family:'Inter',sans-serif;cursor:pointer;box-shadow:0 15px 40px rgba(239,68,68,0.4);transition:all 0.3s;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);"
        onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 50px rgba(239,68,68,0.6)'"
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 15px 40px rgba(239,68,68,0.4)'">
    <span style="display:inline-block;transition:0.3s;">Logout</span>
</button>
    </div>
</header>
            <div id="main-page-content"></div>
        </div>
    </div>`;

    // Add glowing animation
    if (!document.getElementById('logo-glow-style')) {
        const style = document.createElement('style');
        style.id = 'logo-glow-style';
        style.textContent = `
            @keyframes glow {
                from { filter: drop-shadow(0 0 20px #00d4ff); }
                to { filter: drop-shadow(0 0 40px #8b5cf6) drop-shadow(0 0 60px #ff00ff); }
            }
            #sidebar a { display:block;padding:14px 20px;margin:8px 0;border-radius:12px;transition:all 0.3s;color:#bdc3c7;text-decoration:none; }
            #sidebar a:hover { background:rgba(255,255,255,0.1);color:white; }
            #sidebar a.active { background:#3498db;color:white;font-weight:bold; }
        `;
        document.head.appendChild(style);
    }

    // Navigation click handlers
    document.querySelectorAll('#sidebar a').forEach(a => {
        a.onclick = e => {
            e.preventDefault();
            document.querySelector('#sidebar a.active')?.classList.remove('active');
            a.classList.add('active');
            document.getElementById('page-title').textContent = a.textContent.replace(/ [+<].*/g, '').trim();
            renderPage(a.dataset.page);
        };
    });

    renderPage('dashboard');
}

function renderPage(page) {
    const content = document.getElementById('main-page-content');
    const currentUser = users.find(u => u.id === userId);
    const leaderboard = [...users].sort((a, b) => (b.score || 0) - (a.score || 0));
    const canManage = ['admin', 'hr', 'manager'].includes(role);

    if (page === 'dashboard') {
        const isAdminOrManager = ['admin', 'hr', 'manager'].includes(role);

        content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:30px;">

            <!-- ALL PROJECTS -->
            <div class="card" style="padding:35px;background:white;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                    <h3>All Projects (${projects.length})</h3>
                    ${isAdminOrManager ? `<button onclick="showAddProject()" style="padding:12px 28px;background:#3498db;color:white;border:none;border-radius:12px;font-weight:bold;">+ New</button>` : ''}
                </div>
                <div style="max-height:500px;overflow-y:auto;">
                    ${projects.length === 0 ? '<p style="text-align:center;color:#95a5a6;padding:60px;font-size:1.3em;">No projects yet</p>' : projects.map(p => {
                        const assigned = tasks.filter(t => t.project_id == p.id).length;
                        const managerName = users.find(u => u.id == p.manager_id)?.name || 'None';
                        return `<div style="padding:18px;background:#f8f9fa;border-radius:14px;margin:15px 0;border-left:6px solid #3498db;display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <strong style="font-size:1.2em;">${p.name}</strong><br>
                                <small>Manager: <strong>${managerName}</strong> • ${assigned}/${p.task_quantity} tasks • ${p.points} pts total</small>
                            </div>
                            ${isAdminOrManager ? `<button onclick="showEditProject(${p.id})" style="padding:10px 20px;background:#f39c12;color:white;border:none;border-radius:10px;font-weight:bold;">Edit</button>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- ALL TASKS -->
            <div class="card" style="padding:35px;background:white;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                    <h3>All Tasks (${tasks.length})</h3>
                    ${isAdminOrManager ? `<button onclick="showAddTask()" style="padding:12px 28px;background:#27ae60;color:white;border:none;border-radius:12px;font-weight:bold;">+ Assign</button>` : ''}
                </div>
                <div style="max-height:500px;overflow-y:auto;">
                    ${tasks.length === 0 ? '<p style="text-align:center;color:#95a5a6;padding:60px;font-size:1.3em;">No tasks assigned yet</p>' : tasks.map(t => {
                        const p = projects.find(x => x.id == t.project_id) || {};
                        const member = users.find(u => parseInt(u.id) === parseInt(t.user_id));
                        const statusColor = t.status === 'Completed' ? '#27ae60' : 
                                          t.status === 'Pending Approval' ? '#f39c12' : 
                                          t.status === 'Rejected' ? '#e74c3c' : '#3498db';
                        return `<div style="padding:18px;background:#f8f9fa;border-radius:14px;margin:15px 0;border-left:6px solid ${statusColor};display:flex;justify-content:space-between;align-items:center;">
                            <div style="flex:1;">
                                <strong style="font-size:1.1em;">${t.title}</strong><br>
                                <small>→ ${p.name || 'Unknown'} • ${member?.name || 'Unassigned'} • ${t.points || 0} pts • 
                                    <span style="padding:4px 10px;background:${statusColor};color:white;border-radius:20px;font-size:0.8em;">${t.status || 'Pending'}</span>
                                </small>
                            </div>
                            ${isAdminOrManager ? `<button onclick="showEditTask(${t.id})" style="padding:10px 20px;background:#9b59b6;color:white;border:none;border-radius:10px;font-weight:bold;">Edit</button>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- TOP 5 EARNERS — PERFECTLY CLEAN 2025 DESIGN (NO TEXT OVERLAP) -->
<div class="card" style="padding:32px;background:white;border-radius:24px;box-shadow:0 12px 45px rgba(0,0,0,0.12);overflow:hidden;">
    <h3 style="text-align:center;margin:0 0 28px;font-size:1.85em;color:white;background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:18px;border-radius:16px;font-weight:800;">
        Top 5 Earners
    </h3>
    <div style="display:grid;gap:16px;">
        ${leaderboard.slice(0,5).map((u, i) => {
            const rank = i + 1;
            const borderColor = rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#f97316' : '#6366f1';
            const rankText = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
            const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#6366f1';

            return `
            <div style="display:flex;align-items:center;background:#fafafa;padding:18px 22px;border-radius:18px;
                        border-left:5px solid ${borderColor};box-shadow:0 6px 20px rgba(0,0,0,0.08);
                        transition:all 0.3s;${rank <= 3 ? 'transform:scale(1.02);' : ''}"
                 onmouseover="this.style.transform='scale(1.04)'"
                 onmouseout="this.style.transform='${rank <= 3 ? 'scale(1.02)' : 'scale(1)'}'">

                <!-- Rank Badge -->
                <div style="font-size:2em;font-weight:900;color:${rankColor};width:68px;text-align:center;letter-spacing:-1px;">
                    ${rankText}
                </div>

                <!-- Photo -->
                <img src="${u.photo ? u.photo + '?v=' + Date.now() : 'https://via.placeholder.com/58x58?text=' + (u.name?.[0] || 'U')}" 
                     style="width:58px;height:58px;border-radius:50%;object-fit:cover;
                            border:4px solid ${borderColor};margin:0 16px;box-shadow:0 4px 16px rgba(0,0,0,0.2);">

                <!-- Name & Info -->
                <div style="flex:1;">
                    <h4 style="margin:0;font-size:1.26em;color:#1e293b;font-weight:600;line-height:1.3;">
                        ${u.name}
                    </h4>
                    <p style="margin:4px 0 0;color:#64748b;font-size:0.92em;">
                        @${u.username} • <strong style="color:#6366f1;">${u.role.toUpperCase()}</strong>
                    </p>
                </div>

                <!-- Score -->
                <div style="text-align:right;">
                    <div style="font-size:1.9em;font-weight:800;background:linear-gradient(45deg,#10b981,#34d399);
                                -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                        ${u.score || 0}
                    </div>
                    <div style="color:#94a3b8;font-size:0.88em;margin-top:3px;">
                        ${u.completed_tasks || 0} tasks
                    </div>
                </div>
            </div>`;
        }).join('')}
    </div>
</div>`;
    }
        else if (page === 'projects') {
    const canCreate = ['admin', 'hr'].includes(role);

    content.innerHTML = `
    <div class="card" style="padding:40px;background:white;border-radius:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
            <h3>All Projects (${projects.length})</h3>
            ${canCreate ? `<button onclick="showAddProject()" style="padding:16px 36px;background:#3498db;color:white;border:none;border-radius:12px;font-weight:bold;">+ Create Project</button>` : ''}
        </div>

        ${projects.length === 0 ? '<p style="text-align:center;padding:120px;color:#95a5a6;font-size:1.7em;">No projects created yet.</p>' : ''}

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:25px;">
            ${projects.map(p => {
                const assigned = tasks.filter(t => t.project_id == p.id).length;
                const manager = users.find(u => u.id == p.manager_id);
                const progress = Math.round((assigned / p.task_quantity) * 100);
                const isManager = p.manager_id == userId;

                // Use p.project_status (not project.project_status!)
                const status = p.project_status || p.status || 'In Progress';

                return `
                <div style="background:rgba(205, 212, 223, 0.92);padding:28px;border-radius:18px;
                            border-left:8px solid ${status === 'Completed' ? '#27ae60' : 
                                                status === 'Pending HR Approval' ? '#f39c12' : 
                                                progress === 100 ? '#e67e22' : '#3498db'};
                            box-shadow:0 10px 30px rgba(0,0,0,0.1);position:relative;">
                    <h3 style="margin:0 0 12px;font-size:1.5em;color:#2c3e50;">${p.name}</h3>
                    <p><strong>Manager:</strong> ${manager?.name || 'Unassigned'}</p>
                    <p><strong>Points:</strong> ${p.points} total • <strong>Tasks:</strong> ${assigned}/${p.task_quantity}</p>
                    
                    <div style="margin:15px 0;">
                        <div style="background:#ddd;height:12px;border-radius:6px;overflow:hidden;">
                            <div style="width:${progress}%;height:100%;background:#3498db;transition:width 0.6s ease;"></div>
                        </div>
                        <small style="color:#7f8c8d;">${progress}% Assigned</small>
                    </div>

                    ${['admin','hr','manager'].includes(role) && (role !== 'manager' || isManager) ? 
                        `<button onclick="showAddTask(${p.id})" style="padding:10px 20px;background:#27ae60;color:white;border:none;border-radius:10px;font-weight:bold;">
                            Assign Tasks
                        </button>` : ''
                    }

                    ${status === 'Pending HR Approval' && ['hr','admin'].includes(role) ? `
                        <div style="margin-top:20px;padding:20px;background:#fff3cd;border:2px dashed #f39c12;border-radius:14px;text-align:center;">
                            <p style="margin:0 0 15px;color:#e67e22;font-weight:bold;font-size:1.1em;">
                                All tasks completed! Ready for HR approval
                            </p>
                            <button onclick="approveProject(${p.id})" 
                                    style="padding:16px 40px;background:#e67e22;color:white;border:none;border-radius:12px;font-weight:bold;font-size:1.3em;box-shadow:0 8px 25px rgba(230,126,34,0.4);">
                                HR APPROVE PROJECT
                            </button>
                        </div>
                    ` : ''}

                    ${status === 'Completed' ? `
    <div style="margin-top:20px;padding:25px;background:#d5f4e6;border-radius:14px;border:3px solid #27ae60;">
        <strong style="color:#27ae60;font-size:1.4em;display:block;text-align:center;margin-bottom:15px;">
            PROJECT FULLY COMPLETED & APPROVED BY HR
        </strong>

        <!-- Main Final Proof (big) -->
        ${p.final_proof_photo ? `
            <div style="text-align:center;margin-bottom:20px;">
                <p style="color:#27ae60;font-weight:bold;">Final Selected Proof:</p>
                <img src="${p.final_proof_photo}?v=${Date.now()}" 
                     style="max-width:100%;max-height:400px;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.2);border:4px solid #27ae60;">
            </div>
        ` : ''}

        <!-- Gallery of ALL Task Proofs -->
        <details style="margin-top:20px;background:#fff;padding:15px;border-radius:12px;border:2px solid #27ae60;">
            <summary style="cursor:pointer;font-weight:bold;color:#27ae60;font-size:1.1em;">
                View All ${tasks.filter(t => t.project_id == p.id && t.proof_photo).length} Task Proofs
            </summary>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:15px;">
                ${tasks
                  .filter(t => t.project_id == p.id && t.proof_photo && t.status === 'Completed')
                  .map(t => `
                    <div style="text-align:center;background:#f8f9fa;padding:12px;border-radius:10px;">
                        <p style="margin:0 0 8px;font-size:0.9em;color:#2c3e50;"><strong>${t.title}</strong></p>
                        <a href="${t.proof_photo}" target="_blank">
                            <img src="${t.proof_photo}?v=${Date.now()}" 
                                 style="width:100%;height:140px;object-fit:cover;border-radius:8px;border:2px solid #27ae60;">
                        </a>
                    </div>
                  `).join('')}
            </div>
            ${tasks.filter(t => t.project_id == p.id && t.proof_photo && t.status === 'Completed').length === 0 
                ? '<p style="text-align:center;color:#7f8c8d;font-style:italic;">No proofs uploaded</p>' 
                : ''
            }
        </details>
    </div>
` : ''}

                    ${status === 'Pending HR Approval' ? 
                        `<div style="position:absolute;top:10px;right:10px;background:#e67e22;color:white;padding:6px 12px;border-radius:20px;font-size:0.8em;font-weight:bold;">
                            AWAITING HR
                        </div>` : ''
                    }
                </div>`;
            }).join('')}
        </div>
    </div>`;
}
    else if (page === 'tasks') {
        // FIXED: Force number comparison!
        const myTasks = role === 'member' 
        ? tasks.filter(t => parseInt(t.user_id) === parseInt(userId))
        : tasks;

        content.innerHTML = `<div class="card" style="padding:40px;background:rgba(205, 212, 223, 0.92);border-radius:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                <h3>My Tasks (${myTasks.length})</h3>
                ${canManage ? `<button onclick="showAddTask()" style="padding:16px 36px;background:#3498db;color:white;border:none;border-radius:12px;font-weight:bold;">+ Assign Tasks</button>` : ''}
            </div>

            ${myTasks.length === 0 ? '<p style="text-align:center;padding:120px;color:#95a5a6;font-size:1.7em;">No tasks yet. Check back soon!</p>' : ''}

            ${myTasks.map(t => {
                const p = projects.find(x => x.id == t.project_id) || {};
                const status = (t.status || 'Pending').trim();
                const isPending = ['Pending', 'In Progress'].includes(status);
                const isPendingApproval = status === 'Pending Approval';
                const isRejected = status === 'Rejected';
                const isCompleted = status === 'Completed';

                return `<div style="padding:30px;background:#f8f9fa;border-radius:20px;margin:25px 0;
                                 box-shadow:0 12px 35px rgba(0,0,0,0.12);border-left:8px solid ${
                                    isRejected ? '#e74c3c' :
                                    isPendingApproval ? '#f39c12' :
                                    isCompleted ? '#27ae60' : '#3498db'
                                 };">
                    <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:20px;">
                        <div style="flex:1;min-width:300px;">
                            <h3 style="margin:0 0 10px;font-size:1.6em;color:#2c3e50;">${t.title}</h3>
                            <p style="margin:5px 0;color:#555;">
                                <strong>Project:</strong> ${p.name || '—'} • 
                                <strong style="color:#27ae60;">${t.points || 0} points</strong>
                            </p>
                            <div style="margin-top:12px;">
                                <span class="status-badge status-${status.toLowerCase().replace(/ /g,'-')}">${status}</span>
                                ${isPendingApproval ? ' <span style="color:#f39c12;font-weight:bold;">Waiting for approval</span>' : ''}
                                ${isRejected ? ' <span style="color:#e74c3c;font-weight:bold;">Rejected – Please fix</span>' : ''}
                                ${isCompleted ? ' <span style="color:#27ae60;font-weight:bold;">Approved!</span>' : ''}
                            </div>
                        </div>

                        ${role === 'member' ? `
                            <button onclick="openProofUpload(${t.id})" 
                                style="padding:18px 40px;background:${
                                    isRejected ? '#e74c3c' :
                                    isPendingApproval ? '#f39c12' :
                                    isCompleted ? '#27ae60' : '#3498db'
                                };color:white;border:none;border-radius:16px;font-weight:bold;font-size:1.3em;
                                       box-shadow:0 10px 30px rgba(0,0,0,0.25);cursor:pointer;">
                                ${isRejected ? 'Re-Submit Proof' :
                                 isPendingApproval ? 'Update Proof' :
                                 isCompleted ? 'View Proof' : 'Submit Proof Now'}
                            </button>
                        ` : ''}
                    </div>

                    ${t.proof_photo ? `
                        <div style="margin-top:25px;padding:20px;background:#f0f8ff;border-radius:14px;">
                            <strong>${isCompleted ? 'Approved Proof' : 'Current Proof'}:</strong><br><br>
                            <img src="${t.proof_photo}?v=${Date.now()}" style="max-width:100%;max-height:450px;border-radius:12px;border:5px solid ${isCompleted?'#27ae60':isRejected?'#e74c3c':'#3498db'};box-shadow:0 6px 20px rgba(0,0,0,0.15);">
                        </div>
                    ` : ''}

                    ${canManage && isPendingApproval ? `
                        <div style="margin-top:30px;padding:28px;background:#fff8e1;border:3px dashed #f39c12;border-radius:16px;">
                            <h4 style="margin-top:0;color:#e67e22;">Review Submission:</h4>
                            ${t.proof_photo ? `<img src="${t.proof_photo}?v=${Date.now()}" style="max-width:100%;max-height:500px;border-radius:12px;margin:15px 0;display:block;">` : '<em>No proof</em>'}
                            <div style="margin-top:20px;text-align:center;">
                                <button onclick="approveTask(${t.id}, true)" style="padding:16px 40px;background:#27ae60;color:white;border:none;border-radius:12px;font-weight:bold;margin:10px;">Approve & Award ${t.points} pts</button>
                                <button onclick="approveTask(${t.id}, false)" style="padding:16px 40px;background:#e74c3c;color:white;border:none;border-radius:12px;font-weight:bold;">Reject</button>
                            </div>
                        </div>
                    ` : ''}
                </div>`;
            }).join('')}
        </div>`;
    }
    else if (page === 'users' && role === 'admin') {
        content.innerHTML = `<div class="card" style="padding:40px;background:rgba(205, 212, 223, 0.92);border-radius:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:35px;">
                <h3>User Management</h3>
                <button onclick="showAddUser()" style="padding:16px 40px;background:#27ae60;color:white;border:none;border-radius:14px;font-weight:bold;box-shadow:0 6px 20px rgba(39,174,96,0.4);">+ Add User</button>
            </div>
            <table style="width:100%;border-collapse:separate;border-spacing:0 10px;">
                <thead style="background:#3498db;color:white;"><tr><th>Name</th><th>Username</th><th>Role</th><th>Score</th><th>Actions</th></tr></thead>
                <tbody>${users.map(u=>`
                    <tr style="background:#f8f9fa;">
                        <td style="padding:15px;">${u.name}</td>
                        <td style="padding:15px;">${u.username}</td>
                        <td style="padding:15px;">
                            <select onchange="changeUserRole(${u.id},this.value)" ${u.id==userId?'disabled':''} style="padding:10px;border-radius:8px;">
                                <option value="member" ${u.role==='member'?'selected':''}>Member</option>
                                <option value="manager" ${u.role==='manager'?'selected':''}>Manager</option>
                                <option value="hr" ${u.role==='hr'?'selected':''}>HR</option>
                                <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                            </select>
                        </td>
                        <td style="padding:15px;font-weight:bold;color:#27ae60;">${u.score||0} pts</td>
                        <td style="padding:15px;"><button onclick="deleteUser(${u.id})" ${u.id==userId?'disabled':''} style="padding:10px 20px;background:#e74c3c;color:white;border:none;border-radius:8px;">Delete</button></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }
        else if (page === 'leaderboard') {
        content.innerHTML = `<div class="card" style="padding:40px;background:rgba(205, 212, 223, 0.92);border-radius:18px;">
            <h3 style="text-align:center;margin-bottom:40px;font-size:2em;color:#2c3e50;">Leaderboard</h3>
            <div style="display:grid;gap:20px;">
                ${leaderboard.map((u, i) => {
                    const rankColor = i === 0 ? '#f1c40f' : i === 1 ? '#95a5a6' : i === 2 ? '#e67e22' : '#34495e';
                    const rankBadge = i < 3 ? ['1st Place', '2nd Place', '3rd Place'][i] : `#${i+1}`;
                    return `
                    <div style="display:flex;align-items:center;background:#f8f9fa;padding:20px;border-radius:16px;box-shadow:0 8px 25px rgba(0,0,0,0.1);border-left:6px solid ${rankColor};">
                        <div style="font-size:2.5em;font-weight:bold;color:${rankColor};width:80px;text-align:center;">
                            ${rankBadge}
                        </div>
                        <img src="${u.photo ? u.photo + '?v=' + Date.now() : 'https://via.placeholder.com/70x70?text=' + (u.name?.[0] || 'U')}" 
                             style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:4px solid ${rankColor};margin:0 20px;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
                        <div style="flex:1;">
                            <h4 style="margin:0;font-size:1.4em;color:#2c3e50;">${u.name}</h4>
                            <p style="margin:5px 0 0;color:#7f8c8d;font-size:1em;">
                                @${u.username} • <strong style="color:#3498db;">${u.role.toUpperCase()}</strong>
                            </p>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:2.2em;font-weight:bold;color:#27ae60;">
                                ${u.score || 0}
                            </div>
                            <div style="color:#7f8c8d;font-size:0.9em;">points</div>
                            <div style="margin-top:8px;color:#95a5a6;font-size:0.9em;">
                                ${u.completed_tasks || 0} tasks completed
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }
    else if (page === 'profile') {
    content.innerHTML = `<div class="card" style="max-width:750px;margin:0 auto;padding:40px;background:rgba(205, 212, 223, 0.92);border-radius:18px;">
        <h3 style="text-align:center;color:#2c3e50;font-size:2em;">My Profile</h3>
        <div style="text-align:center;margin:40px 0;">
            <img id="profilePhoto" src="${currentUser.photo ? currentUser.photo + '?v=' + Date.now() : 'https://via.placeholder.com/160?text=' + (currentUser.name?.[0] || 'U')}" 
                 style="width:160px;height:160px;border-radius:50%;object-fit:cover;border:6px solid #3498db;">
            <br><br>
            <input type="file" id="photoInput" accept="image/*" style="display:none;">
            <button onclick="document.getElementById('photoInput').click()" 
                    style="padding:14px 32px;background:#3498db;color:white;border:none;border-radius:12px;font-weight:bold;cursor:pointer;">
                Change Photo
            </button>
            <div id="uploadStatus" style="margin-top:15px;color:#27ae60;font-weight:bold;"></div>
        </div>

        <div style="background:#f8f9fa;padding:30px;border-radius:16px;">
            <p><strong>Name:</strong> ${currentUser.name || 'N/A'}</p>
            <p><strong>Username:</strong> ${currentUser.username || 'N/A'}</p>
            <p><strong>Role:</strong> <span style="color:#e74c3c;text-transform:uppercase;font-weight:bold;">${currentUser.role || 'N/A'}</span></p>
            <p><strong>Score:</strong> ${currentUser.score || 0} points</p>
            <p><strong>Completed Tasks:</strong> ${currentUser.completed_tasks || 0}</p>
        </div>

        <h4 style="margin-top:30px;border-bottom:3px solid #3498db;padding-bottom:10px;">Change Password</h4>
        <input type="password" id="oldPassword" placeholder="Current Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
        <input type="password" id="newPassword" placeholder="New Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
        <input type="password" id="confirmPassword" placeholder="Confirm New Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
        <button id="changePasswordBtn" style="width:100%;padding:18px;background:#3498db;color:white;border:none;border-radius:12px;font-size:1.2em;font-weight:bold;margin-top:15px;">Update Password</button>
        <p id="passwordMessage" style="margin-top:15px;text-align:center;font-weight:bold;"></p>
    </div>`;

    // ==================== PROFILE PHOTO UPLOAD (100% FIXED) ====================
    document.getElementById('photoInput').addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const statusEl = document.getElementById('uploadStatus');
        statusEl.textContent = 'Uploading...';
        statusEl.style.color = '#3498db';

        // Preview immediately
        const reader = new FileReader();
        reader.onload = () => document.getElementById('profilePhoto').src = reader.result;
        reader.readAsDataURL(file);

        const fd = new FormData();
        fd.append('photo', file);

        try {
            const res = await fetch('api/upload_photo.php', {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            const result = await res.json();

            if (result.success) {
                const cleanUrl = result.photo_url.split('?')[0]; // Save clean URL
                document.getElementById('profilePhoto').src = result.photo_url; // With cache buster
                currentUser.photo = cleanUrl; // Update in memory

                statusEl.textContent = 'Photo updated successfully!';
                statusEl.style.color = '#27ae60';
            } else {
                statusEl.textContent = 'Failed: ' + (result.error || 'Try again');
                statusEl.style.color = '#e74c3c';
            }
        } catch (err) {
            statusEl.textContent = 'Upload error. Check server.';
            statusEl.style.color = '#e74c3c';
            console.error(err);
        }
    });

    // ==================== CHANGE PASSWORD (FIXED & CLEAN) ====================
    document.getElementById('changePasswordBtn').addEventListener('click', async () => {
        const oldP = document.getElementById('oldPassword').value;
        const newP = document.getElementById('newPassword').value;
        const confP = document.getElementById('confirmPassword').value;
        const msg = document.getElementById('passwordMessage');

        if (!oldP || !newP || !confP) return msg.textContent = 'Fill all fields', msg.style.color = 'red';
        if (newP !== confP) return msg.textContent = 'Passwords do not match', msg.style.color = 'red';
        if (newP.length < 6) return msg.textContent = 'Password too short', msg.style.color = 'red';

        try {
            const res = await api('change_password.php', { old_password: oldP, new_password: newP });
            if (res.success) {
                msg.textContent = 'Password changed successfully!';
                msg.style.color = 'green';
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                msg.textContent = 'Wrong current password';
                msg.style.color = 'red';
            }
        } catch (err) {
            msg.textContent = 'Server error';
            msg.style.color = 'red';
        }
    });
}
}

// ======================== EDIT PROJECT (ADMIN + MANAGER) ========================
function showEditProject(projectId) {
    const project = projects.find(p => p.id == projectId);
    if (!project) return alert('Project not found');

    const managers = users.filter(u => u.role === 'manager');
    
    openModal('Edit Project', `
        <input type="text" id="editProjName" value="${project.name}" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <select id="editProjManager" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="">Unassigned</option>
            ${managers.map(m => `<option value="${m.id}" ${m.id == project.manager_id ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
        <input type="number" id="editTotalPoints" value="${project.points}" min="10" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <input type="number" id="editTaskQuantity" value="${project.task_quantity}" min="1" max="100" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
    `, async () => {
        const name = document.getElementById('editProjName').value.trim();
        const managerId = document.getElementById('editProjManager').value || null;
        const points = parseInt(document.getElementById('editTotalPoints').value);
        const taskQty = parseInt(document.getElementById('editTaskQuantity').value);

        if (!name || points < 10 || taskQty < 1) return alert('Invalid data');

        try {
            await api('edit_project.php', {
                project_id: projectId,
                name, manager_id: managerId, points, task_quantity: taskQty
            });
            alert('Project updated!');
            await loadAllData();
            renderPage('dashboard');
        } catch (err) { alert('Error: ' + err.message); }
    });
}

// ======================== EDIT TASK (ADMIN + MANAGER) ========================
function showEditTask(taskId) {
    const task = tasks.find(t => t.id == taskId);
    if (!task) return alert('Task not found');

    const project = projects.find(p => p.id == task.project_id);
    const members = users.filter(u => u.role === 'member');

    openModal('Edit Task', `
        <input type="text" id="editTaskTitle" value="${task.title}" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        <p><strong>Project:</strong> ${project.name}</p>
        <select id="editTaskMember" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="">Unassigned</option>
            ${members.map(m => `<option value="${m.id}" ${m.id == task.user_id ? 'selected' : ''}>${m.name} (@${m.username})</option>`).join('')}
        </select>
        <input type="number" id="editTaskPoints" value="${task.points || Math.floor(project.points / project.task_quantity)}" min="1" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
    `, async () => {
        const title = document.getElementById('editTaskTitle').value.trim();
        const userId = document.getElementById('editTaskMember').value || null;
        const points = parseInt(document.getElementById('editTaskPoints').value);

        if (!title || points < 1) return alert('Fill all fields');

        try {
            await api('edit_task.php', {
                task_id: taskId,
                title, user_id: userId, points
            });
            alert('Task updated!');
            await loadAllData();
            renderPage('dashboard');
        } catch (err) { alert('Error: ' + err.message); }
    });
}

// Add beautiful status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; color: white; margin-right: 8px; }
    .status-pending { background: #95a5a6; }
    .status-in-progress { background: #3498db; }
    .status-pending-approval { background: #f39c12; }
    .status-completed { background: #27ae60; }
    .status-rejected { background: #e74c3c; }
`;
document.head.appendChild(style);