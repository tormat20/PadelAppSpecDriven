INSERT INTO users (id, email, hashed_password, role)
VALUES (?, ?, ?, 'admin')
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    role = 'admin';
