# CompAI Backend

Backend service for **CompAI**, built with **NestJS + PostgreSQL + Prisma**.
It provides REST APIs for managing sessions, responses, and AI model comparisons.

---

## 🚀 Tech Stack

* **NestJS** (backend framework)
* **Prisma** (ORM)
* **PostgreSQL** (database)
* **OpenAI API** (AI generation)

---

## 🔧 Setup Instructions

### 1. Clone repo

```bash
git clone https://github.com/PrajwalBanakar/compai_backend.git
cd compai_backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file at the root using the template below:

```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-xxxx"
PORT=4000
```

### 4. Prisma setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run locally

```bash
npm run start:dev
```

Backend runs at `http://localhost:4000`.

---

## 📂 Project Structure

```
src/
 ├─ ai/              # AI service (OpenAI integration)
 ├─ sessions/        # Sessions + responses logic
 ├─ prisma/          # DB schema + migrations
 └─ main.ts          # App bootstrap
```

---

## 📜 License

MIT
