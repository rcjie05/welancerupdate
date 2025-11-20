// =============================================
// FINAL ULTIMATE WeLancer script.js (2025)
// FULLY WORKING: Admin + HR + Manager + Member
// Admin can: Add, Change Role, Delete Users
// Everything saves to database permanently
// =============================================

let role = '', userId = 0;
let tasks = [], projects = [], users = [];

// ======================== API HELPER ========================
async function api(endpoint, data = null, isFormData = false) {
    const res = await fetch(`http://localhost/welancer/api/${endpoint}`, {
        method: data ? 'POST' : 'GET',
        credentials: 'include',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? data : (data ? JSON.stringify(data) : null)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Server error');
    }
    return await res.json();
}

// ======================== ADMIN FUNCTIONS (MUST BE FIRST) ========================

// CHANGE USER ROLE
async function changeUserRole(userIdToChange, newRole) {
    if (userIdToChange == userId) {
        alert("You cannot change your own role!");
        await loadAllData();
        renderPage('users');
        return;
    }

    if (confirm(`Change role to "${newRole.toUpperCase()}"?`)) {
        try {
            await api('change_user_role.php', { user_id: userIdToChange, role: newRole });
            alert('Role updated successfully!');
            await loadAllData();
            renderPage('users');
        } catch (err) {
            alert('Failed to update role: ' + err.message);
            console.error(err);
        }
    }
}

// DELETE USER
async function deleteUser(userIdToDelete) {
    if (userIdToDelete == userId) {
        alert("You cannot delete yourself!");
        return;
    }

    if (confirm('PERMANENTLY delete this user?\nThis cannot be undone!')) {
        try {
            await api('delete_user.php', { user_id: userIdToDelete });
            alert('User deleted successfully!');
            await loadAllData();
            renderPage('users');
        } catch (err) {
            alert('Failed to delete user: ' + err.message);
        }
    }
}

// ADD NEW USER
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

        if (!name || !username || password.length < 6) {
            return alert('Please fill all fields correctly (password ≥ 6 characters)');
        }

        try {
            await api('add_user.php', { name, username, password, role });
            alert('User added successfully!');
            await loadAllData();
            renderPage('users');
        } catch (err) {
            alert('Failed to add user: ' + err.message);
        }
    });
}

// ADD PROJECT
function showAddProject() {
    // ONLY ADMIN & HR CAN ACCESS THIS
    if (!['admin', 'hr'].includes(role)) {
        alert('Only Admin and HR can create projects!');
        return;
    }

    const managers = users.filter(u => u.role === 'manager');

    if (managers.length === 0) {
        alert('No managers available. Create a manager first!');
        return;
    }

    openModal('Add New Project (Admin/HR Only)', `
        <input type="text" id="projName" placeholder="Project Name" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        
        <select id="projManager" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="" disabled selected>Assign to Manager</option>
            ${managers.map(m => `<option value="${m.id}">${m.name} (${m.username})</option>`).join('')}
        </select>

        <select id="projStatus" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option>In Progress</option>
            <option>Pending</option>
            <option>Completed</option>
        </select>
    `, async () => {
        const name = document.getElementById('projName').value.trim();
        const managerId = document.getElementById('projManager').value;
        const status = document.getElementById('projStatus').value;

        if (!name || !managerId) return alert('Project name and manager are required!');

        try {
            await api('add_project.php', { 
                name, 
                status,
                manager_id: managerId
            });

            alert('Project created and assigned to manager successfully!');
            await loadAllData();
            renderPage('projects');
        } catch (err) {
            alert('Error: ' + err.message);
        }
    });
}

// ADD TASK
// ADD TASK - 100% FIXED FOR MANAGERS
function showAddTask() {
    const allowedProjects = role === 'manager' 
        ? projects.filter(p => parseInt(p.manager_id) === userId)
        : projects;

    if (allowedProjects.length === 0) {
        alert(role === 'manager' 
            ? 'No projects assigned to you yet. Ask Admin/HR to assign a project.'
            : 'No projects available.'
        );
        return;
    }

    openModal('Create New Task', `
        <input type="text" id="taskTitle" placeholder="Task Title" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
        
        <select id="taskProject" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option value="" disabled selected>Select Project</option>
            ${allowedProjects.map(p => `
                <option value="${p.id}">${p.name}</option>
            `).join('')}
        </select>

        <div id="teamContainer" style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:10px;display:none;">
            <p><strong>Team:</strong> <span id="selectedTeam">—</span></p>
        </div>

        <select id="taskUser" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option>Select project first</option>
        </select>

        <select id="taskStatus" style="width:100%;padding:14px;margin:10px 0;border-radius:10px;border:1px solid #ddd;">
            <option>Pending</option>
            <option>In Progress</option>
            <option>Completed</option>
        </select>
    `, async () => {
        const title = document.getElementById('taskTitle').value.trim();
        const projectId = document.getElementById('taskProject').value;
        const userId = document.getElementById('taskUser').value;
        const status = document.getElementById('taskStatus').value;

        if (!title || !projectId || !userId) {
            alert('Please fill all fields');
            return;
        }

        await api('add_task.php', { title, project_id: projectId, user_id: userId, status });
        alert('Task created successfully!');
        await loadAllData();
        renderPage('tasks');
    });

    document.getElementById('taskProject').addEventListener('change', async function() {
        const projectId = this.value;
        const teamContainer = document.getElementById('teamContainer');
        const userSelect = document.getElementById('taskUser');
        const selectedTeamSpan = document.getElementById('selectedTeam');

        if (!projectId) {
            userSelect.innerHTML = '<option>Select project first</option>';
            teamContainer.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`http://localhost/welancer/api/get_team.php?project_id=${projectId}`);
            const data = await res.json();

            if (data.team && data.members?.length > 0) {
                teamContainer.style.display = 'block';
                selectedTeamSpan.textContent = data.team.name;
                userSelect.innerHTML = data.members.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
            } else {
                teamContainer.style.display = 'none';
                userSelect.innerHTML = users
                    .filter(u => u.role === 'member')
                    .map(u => `<option value="${u.id}">${u.name}</option>`)
                    .join('') || '<option>No members available</option>';
            }
        } catch (err) {
            userSelect.innerHTML = '<option>Error loading members</option>';
        }
    });
}

// MODAL SYSTEM
function openModal(title, html, onSave) {
    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
        <div style="background:white;padding:40px;border-radius:20px;width:90%;max-width:540px;box-shadow:0 30px 90px rgba(0,0,0,0.5);">
            <h3 style="margin:0 0 30px;color:#2c3e50;font-size:1.6em;">${title}</h3>
            ${html}
            <div style="margin-top:35px;text-align:right;">
                <button onclick="document.getElementById('app-modal')?.remove()" 
                        style="padding:12px 24px;background:#ddd;border:none;border-radius:10px;margin-right:15px;cursor:pointer;font-weight:bold;">
                    Cancel
                </button>
                <button id="saveBtn" 
                        style="padding:14px 34px;background:#3498db;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;font-size:1.1em;">
                    Save
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('saveBtn').onclick = async () => {
        await onSave();
        modal.remove();
    };
}

// ======================== LOGIN & DATA ========================
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
        const result = await api('login.php', { username, password });
        if (result.success) {
            role = result.user.role;
            userId = result.user.id;
            document.querySelector('.login-container').remove();
            document.getElementById('floating-bg')?.remove();
            await loadAllData();
            renderFullApp();
        } else {
            alert('Wrong username or password!');
        }
    } catch (err) {
        alert('Login failed. Is XAMPP running?');
    }
});

async function loadAllData() {
    try {
        [tasks, projects, users] = await Promise.all([
            api('tasks.php'),
            api('projects.php'),
            api('users.php')
        ]);
    } catch (err) {
        console.error(err);
        alert('Failed to load data');
    }
}

// ======================== MAIN APP ========================
function renderFullApp() {
    const currentUser = users.find(u => u.id === userId) || {};

    document.body.innerHTML = `
    <div id="app-root" style="display:flex;min-height:100vh;font-family:'Poppins',sans-serif;background:#f4f6f9;">
        <aside id="sidebar" style="width:280px;background:#2c3e50;color:white;padding:30px;box-shadow:6px 0 25px rgba(0,0,0,0.15);">
            <h2 style="text-align:center;margin-bottom:50px;color:#3498db;font-size:2em;">WeLancer</h2>
            <nav style="font-size:1.15em;">
                <a href="#" class="active" data-page="dashboard">Dashboard</a>
                <a href="#" data-page="projects">Projects ${['admin','hr'].includes(role) ? '<span style="float:right;">+</span>' : ''}</a>
                <a href="#" data-page="tasks">Tasks ${['admin','hr','manager'].includes(role) ? '<span style="float:right;">+</span>' : ''}</a>
                ${role === 'admin' ? '<a href="#" data-page="users">Users <span style="float:right;">+</span></a>' : ''}
                <a href="#" data-page="leaderboard">Leaderboard</a>
                <a href="#" data-page="profile">Profile</a>
            </nav>
            <div style="margin-top:auto;padding-top:40px;border-top:1px solid #444;text-align:center;">
                <small>Logged in as<br><strong style="font-size:1.2em;">${currentUser.role?.toUpperCase() || 'USER'}</strong></small>
            </div>
        </aside>

        <div id="main-container" style="flex:1;padding:40px;">
            <header style="background:white;padding:25px 35px;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,0.12);margin-bottom:35px;display:flex;justify-content:space-between;align-items:center;">
                <h1 id="page-title" style="margin:0;color:#2c3e50;font-size:2.2em;">Dashboard</h1>
                <button onclick="location.reload()" style="padding:14px 32px;background:#e74c3c;color:white;border:none;border-radius:12px;font-weight:bold;cursor:pointer;font-size:1.1em;">
                    Logout
                </button>
            </header>
            <div id="main-page-content"></div>
        </div>
    </div>`;

    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#sidebar a.active')?.classList.remove('active');
            link.classList.add('active');
            document.getElementById('page-title').textContent = link.textContent.replace(/ [+<].*/, '').trim();
            renderPage(link.dataset.page);
        });
    });

    renderPage('dashboard');
}

function renderPage(page) {
    const content = document.getElementById('main-page-content');
    const currentUser = users.find(u => u.id === userId);
    const leaderboard = [...users].sort((a, b) => (b.score || 0) - (a.score || 0));
    const canManage = ['admin', 'hr', 'manager'].includes(role);

    if (page === 'dashboard') {
        content.innerHTML = `
            <div class="card" style="padding:30px;background:white;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,0.1);">
    <h3>My Projects</h3>
    ${(() => {
    const list = role === 'manager' 
        ? projects.filter(p => parseInt(p.manager_id) === userId)
        : projects;
    return list.length 
        ? list.map(p => `<p><strong>${p.name}</strong> <span class="status-badge status-${p.status.toLowerCase().replace(' ','-')}">${p.status}</span></p>`).join('')
        : '<p style="color:#95a5a6;">No projects assigned yet</p>';
})()}
</div>
                <div class="card" style="padding:30px;background:white;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,0.1);">
                    <h3>My Tasks</h3>
                    ${tasks.filter(t => role === 'member' ? t.user_id == userId : true)
                        .map(t => `<p><strong>${t.title}</strong> <small>(${projects.find(p => p.id == t.project_id)?.name || '—'})</small></p>`).join('') || '<p>No tasks</p>'}
                </div>
                <div class="card" style="padding:30px;background:white;border-radius:18px;box-shadow:0 8px 30px rgba(0,0,0,0.1);">
                    <h3>Top 5 Performers</h3>
                    <ol style="padding-left:20px;">
                        ${leaderboard.slice(0,5).map(u => `<li><strong>${u.name}</strong> — ${u.score || 0} pts</li>`).join('')}
                    </ol>
                </div>
            </div>`;
    }
    else if (page === 'projects') {
    content.innerHTML = `
        <div class="card" style="padding:40px;background:white;border-radius:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                <h3>All Projects (${role === 'manager' ? projects.filter(p => parseInt(p.manager_id) === userId).length : projects.length})</h3>
                ${['admin','hr','manager'].includes(role) ? `<button onclick="showAddProject()" style="padding:16px 36px;background:#3498db;color:white;border:none;border-radius:12px;font-size:1.1em;font-weight:bold;cursor:pointer;">+ Add Project</button>` : ''}
            </div>
            ${(() => {
                const list = role === 'manager'
                    ? projects.filter(p => parseInt(p.manager_id) === userId)
                    : projects;
                return list.length
                    ? list.map(p => `
                        <div style="padding:20px;background:#f8f9fa;border-radius:14px;margin:15px 0;">
                            <strong style="font-size:1.4em;">${p.name}</strong>
                            <span class="status-badge status-${p.status.toLowerCase().replace(' ','')}">${p.status}</span>
                            ${role !== 'manager' ? `<small style="color:#7f8c8d;float:right;">Manager: ${p.manager_name || 'Unassigned'}</small>` : ''}
                        </div>
                    `).join('')
                    : '<p style="text-align:center;padding:80px;color:#95a5a6;font-size:1.3em;">No projects assigned to you</p>';
            })()}
        </div>`;
    }
    else if (page === 'tasks') {
        content.innerHTML = `
            <div class="card" style="padding:40px;background:white;border-radius:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                    <h3>All Tasks (${tasks.length})</h3>
                    ${canManage ? `<button onclick="showAddTask()" style="padding:16px 36px;background:#3498db;color:white;border:none;border-radius:12px;font-size:1.1em;font-weight:bold;cursor:pointer;">+ Add Task</button>` : ''}
                </div>
                ${tasks.length ? tasks.map(t => {
                    const p = projects.find(x => x.id == t.project_id);
                    const u = users.find(x => x.id == t.user_id);
                    return `<div style="padding:20px;background:#f8f9fa;border-radius:14px;margin:15px 0;">
                        <strong style="font-size:1.2em;">${t.title}</strong><br>
                        <small>Project: <strong>${p?.name || '—'}</strong> → Assigned: <strong>${u?.name || '—'}</strong></small>
                        <span style="float:right;" class="status-badge status-${t.status.toLowerCase()}">${t.status}</span>
                    </div>`;
                }).join('') : '<p style="text-align:center;padding:80px;color:#95a5a6;font-size:1.3em;">No tasks yet</p>'}
            </div>`;
    }
    else if (page === 'users' && role === 'admin') {
        content.innerHTML = `
            <div class="card" style="padding:40px;background:white;border-radius:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:35px;flex-wrap:wrap;gap:20px;">
                    <h3 style="margin:0;font-size:2em;color:#2c3e50;">User Management</h3>
                    <button onclick="showAddUser()" style="padding:16px 40px;background:#27ae60;color:white;border:none;border-radius:14px;font-weight:bold;font-size:1.2em;cursor:pointer;box-shadow:0 6px 20px rgba(39,174,96,0.4);">
                        + Add New User
                    </button>
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%;min-width:900px;border-collapse:separate;border-spacing:0;background:white;">
                        <thead style="background:#3498db;color:white;">
                            <tr>
                                <th style="padding:20px 15px;text-align:left;font-size:1.1em;">Name</th>
                                <th style="padding:20px 15px;">Username</th>
                                <th style="padding:20px 15px;">Role</th>
                                <th style="padding:20px 15px;">Score</th>
                                <th style="padding:20px 15px;text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr style="border-bottom:1px solid #eee;transition:0.3s;">
                                    <td style="padding:20px 15px;font-weight:600;">${u.name}</td>
                                    <td style="padding:20px 15px;color:#7f8c8d;">${u.username}</td>
                                    <td style="padding:20px 15px;">
                                        <select onchange="changeUserRole(${u.id}, this.value)"
                                                style="padding:12px 16px;border-radius:10px;border:1px solid #3498db;background:white;color:#2c3e50;font-weight:bold;cursor:pointer;width:140px;"
                                                ${u.id == userId ? 'disabled title="Cannot change own role"' : ''}>
                                            <option value="member"  ${u.role==='member'?'selected':''}>Member</option>
                                            <option value="manager" ${u.role==='manager'?'selected':''}>Manager</option>
                                            <option value="hr"      ${u.role==='hr'?'selected':''}>HR</option>
                                            <option value="admin"   ${u.role==='admin'?'selected':''}>Admin</option>
                                        </select>
                                    </td>
                                    <td style="padding:20px 15px;font-weight:bold;color:#27ae60;">${u.score || 0} pts</td>
                                    <td style="padding:20px 15px;text-align:center;">
                                        <button onclick="deleteUser(${u.id})"
                                                ${u.id == userId ? 'disabled' : ''}
                                                style="padding:12px 28px;background:#e74c3c;color:white;border:none;border-radius:10px;font-weight:bold;cursor:pointer;
                                                       ${u.id == userId ? 'opacity:0.5;cursor:not-allowed;' : 'box-shadow:0 6px 20px rgba(231,76,60,0.4);'}">
                                            Delete User
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }
    else if (page === 'leaderboard') {
        content.innerHTML = `
            <div class="card" style="padding:40px;background:white;border-radius:18px;">
                <h3 style="text-align:center;margin-bottom:30px;font-size:2em;color:#2c3e50;">Leaderboard</h3>
                <table style="width:100%;border-collapse:collapse;">
                    <thead style="background:#2c3e50;color:white;">
                        <tr>
                            <th style="padding:18px;text-align:center;">Rank</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Score</th>
                            <th>Tasks Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leaderboard.map((u, i) => `
                            <tr style="border-bottom:1px solid #eee;">
                                <td style="padding:18px;text-align:center;font-weight:bold;font-size:1.3em;color:#3498db;">${i+1}</td>
                                <td style="padding:18px;font-weight:600;">${u.name}</td>
                                <td style="padding:18px;">${u.role}</td>
                                <td style="padding:18px;font-weight:bold;color:#27ae60;">${u.score || 0}</td>
                                <td style="padding:18px;">${u.completed_tasks || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }
    else if (page === 'profile') {
        content.innerHTML = `
            <div class="card" style="max-width:750px;margin:0 auto;padding:40px;background:white;border-radius:18px;">
                <h3 style="text-align:center;color:#2c3e50;font-size:2em;">My Profile</h3>
                <div style="text-align:center;margin:40px 0;">
                    <img id="profilePhoto" src="${currentUser.photo || 'https://via.placeholder.com/160?text=' + (currentUser.name?.[0] || 'U')}" 
                         style="width:160px;height:160px;border-radius:50%;object-fit:cover;border:6px solid #3498db;box-shadow:0 8px 30px rgba(0,0,0,0.2);">
                    <br><br>
                    <input type="file" id="photoInput" accept="image/*" style="display:none;">
                    <button onclick="document.getElementById('photoInput').click()" 
                            style="padding:14px 32px;background:#3498db;color:white;border:none;border-radius:12px;font-weight:bold;cursor:pointer;">
                        Change Photo
                    </button>
                </div>
                <div style="background:#f8f9fa;padding:30px;border-radius:16px;margin:30px 0;">
                    <p><strong>Name:</strong> ${currentUser.name || 'N/A'}</p>
                    <p><strong>Username:</strong> ${currentUser.username || 'N/A'}</p>
                    <p><strong>Role:</strong> <span style="color:#e74c3c;font-weight:bold;text-transform:uppercase;font-size:1.2em;">${currentUser.role || 'N/A'}</span></p>
                    <p><strong>Score:</strong> ${currentUser.score || 0} points</p>
                    <p><strong>Completed Tasks:</strong> ${currentUser.completed_tasks || 0}</p>
                </div>
                <h4 style="color:#2c3e50;border-bottom:3px solid #3498db;padding-bottom:10px;">Change Password</h4>
                <div style="margin:20px 0;">
                    <input type="password" id="oldPassword" placeholder="Current Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
                    <input type="password" id="newPassword" placeholder="New Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
                    <input type="password" id="confirmPassword" placeholder="Confirm New Password" style="width:100%;padding:16px;margin:10px 0;border-radius:12px;border:1px solid #ddd;">
                </div>
                <button id="changePasswordBtn" style="width:100%;padding:18px;background:#3498db;color:white;border:none;border-radius:12px;font-size:1.2em;font-weight:bold;cursor:pointer;">
                    Update Password
                </button>
                <p id="passwordMessage" style="margin-top:20px;text-align:center;font-weight:bold;"></p>
            </div>`;

        document.getElementById('photoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Instant preview
    const reader = new FileReader();
    reader.onload = (ev) => document.getElementById('profilePhoto').src = ev.target.result;
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('photo', file);

    try {
        const res = await fetch('http://localhost/welancer/api/upload_photo.php', {
            method: 'POST',
            credentials: 'include',  // THIS IS THE MAGIC LINE
            body: fd
        });

        const result = await res.json();

        if (res.ok && result.success) {
            document.getElementById('profilePhoto').src = result.photo_url + '?t=' + Date.now();
            alert('Photo updated successfully!');
            await loadAllData(); // Refresh user data
        } else {
            alert('Upload failed: ' + (result.error || 'Server error'));
            // Revert preview
            await loadAllData();
            const currentUser = users.find(u => u.id === userId);
            document.getElementById('profilePhoto').src = currentUser.photo || 'https://via.placeholder.com/160?text=U';
        }
    } catch (err) {
        alert('Upload error: ' + err.message);
        console.error(err);
    }
});

        document.getElementById('changePasswordBtn').onclick = async () => {
            const oldP = document.getElementById('oldPassword').value;
            const newP = document.getElementById('newPassword').value;
            const confP = document.getElementById('confirmPassword').value;
            const msg = document.getElementById('passwordMessage');
            if (!oldP || !newP || !confP) return msg.textContent = 'All fields required', msg.style.color = 'red';
            if (newP !== confP) return msg.textContent = 'Passwords do not match', msg.style.color = 'red';
            if (newP.length < 6) return msg.textContent = 'Password too short', msg.style.color = 'red';
            try {
                const res = await api('change_password.php', { old_password: oldP, new_password: newP });
                msg.style.color = res.success ? 'green' : 'red';
                msg.textContent = res.success ? 'Password changed!' : 'Wrong current password';
                if (res.success) document.querySelectorAll('#oldPassword,#newPassword,#confirmPassword').forEach(i => i.value = '');
            } catch { msg.textContent = 'Server error', msg.style.color = 'red'; }
        };
    }
}