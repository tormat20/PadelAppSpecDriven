SELECT id, email, hashed_password, role, created_at
FROM users
WHERE id = ?;
