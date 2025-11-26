CREATE DATABASE IF NOT EXISTS welancer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE welancer;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('member','manager','hr','admin') DEFAULT 'member',
    score INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    photo VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    manager_id INT DEFAULT NULL,
    points INT NOT NULL DEFAULT 100,
    task_quantity INT NOT NULL DEFAULT 5,
    points_per_task INT NOT NULL DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('Pending','In Progress','Pending Approval','Completed','Rejected') DEFAULT 'Pending',
    points INT NOT NULL DEFAULT 20,
    proof_photo VARCHAR(255) DEFAULT NULL,
    submitted_at TIMESTAMP NULL DEFAULT NULL,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO users (id, name, username, password, role, score, completed_tasks, photo) VALUES
(1, 'Rcjie V.',        'admin',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',   0, 0, NULL),
(2, 'Charles M.',      'hr',        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hr',      0, 0, NULL),
(3, 'Johannes T.',     'manager',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 0, 0, NULL),
(4, 'JayEm R.',        'managers',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 0, 0, NULL),
(5, 'Clarence P.',     'member',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member',  0, 0, NULL),
(6, 'user',            'user',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'member',  0, 0, NULL);