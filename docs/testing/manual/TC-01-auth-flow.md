---
id: "TC-01"
title: "Authentication, Password Policy, Session & Route Guard Flow"
category: "Authentication & Security"
priority: "Critical"
target: "Auth Pages (/login, /register) & Protected Routes"
coverage: "[[mission#^a2-login-jwt]], [[mission#^a4-password-hash]], [[mission#^a6-auth-protection]], [[mission#^n4-automated-tests]]"
status: "⚪ Pending"
---

# 🧪 TC-01: Authentication, Password Policy, Session & Route Guard Flow

## 🎯 Objective
Verify the end-to-end authentication lifecycle: user registration, server-side password length policy, generic login failure feedback, valid session establishment with `httpOnly` cookie, logout token invalidation, and 401 unauthenticated route guard protection.

---

## 📋 Pre-conditions
1. SQLite database seeded with demo credentials (`demo@stockflow.dev` / `password123`).
2. Browser in Clean/Incognito session (no existing cookies).

---

## 🪜 Step-by-Step Test Procedure

| Step # | Action | Input / Payload | Expected Result | Pass / Fail |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Navigate to `/register` and attempt registration with short password | Email: `short@stockflow.dev`<br>Password: `12345` (< 8 chars) | Server rejects with validation error: *"Password must be at least 8 characters long"*. | `[ ]` |
| **2** | Register with valid credentials | Email: `newuser@stockflow.dev`<br>Password: `strongPassword123` | User registered successfully, password hashed via bcrypt, redirected to `/login`. | `[ ]` |
| **3** | Attempt login with invalid password | Email: `demo@stockflow.dev`<br>Password: `wrongpass` | Request rejected with generic error: *"Invalid email or password"*. Does not leak user existence. | `[ ]` |
| **4** | Login with valid demo credentials | Email: `demo@stockflow.dev`<br>Password: `password123` | Login succeeds, `httpOnly` cookie `stockflow_token` is set, redirected to `/products`. | `[ ]` |
| **5** | Click `[ Logout ]` in navbar | Click logout button | Session cookie removed/cleared, client redirected to `/login`. | `[ ]` |
| **6** | Attempt unauthenticated direct access to `/products` | Open URL `http://localhost:3000/products` | Server middleware blocks access and redirects to `/login` with 401 unauthenticated guard. | `[ ]` |
