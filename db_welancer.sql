CREATE DATABASE welancer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE welancer;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('manager','member','hr','admin') DEFAULT 'member',
    score INT DEFAULT 0,
    completed_tasks INT DEFAULT 0
);

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    team VARCHAR(100),
    deadline DATE,
    status ENUM('Pending','In Progress','Complete') DEFAULT 'Pending'
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    project_id INT,
    user_id INT,
    status ENUM('pending','inprogress','complete') DEFAULT 'pending',
    contribution INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    project_id INT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE team_members (
    team_id INT,
    user_id INT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

ALTER TABLE tasks ADD COLUMN team_id INT NULL;
ALTER TABLE tasks ADD FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

INSERT INTO users (name, username, password, role, score, completed_tasks) VALUES
('Jay-em R.', 'manager', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 1100, 1),
('John Clarence', 'member', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr', 1250, 1),
('Rcjie V.', 'rcjie', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 750, 0),
('Charles V.', 'charles', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 980, 0),
('Johannes T.', 'johannes', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member', 620, 1);

INSERT INTO projects (name, team, deadline, status) VALUES
('WeLancer Capstone System', 'Team Hercules', '2025-05-15', 'In Progress'),
('Marketing Campaign Q4', 'Marketing Group', '2025-11-30', 'Pending'),
('Website Re-design 2026', 'Web Dev', '2024-12-01', 'Complete'),
('HR Policy Documentation', 'HR Team', '2025-02-28', 'In Progress');

INSERT INTO tasks (title, project_id, user_id, status, contribution) VALUES
('Design Landing Page Mockup', 1, 4, 'complete', 100),
('Develop Leaderboard Algorithm', 2, 2, 'inprogress', 80),
('Write Capstone Chapter 2 (RRL)', 1, 4, 'pending', 40),
('Setup Laravel Development Environment', 3, 5, 'complete', 100),
('Prototype UI/UX Wireframes', 1, 3, 'inprogress', 70);