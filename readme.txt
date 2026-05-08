ktaliman trading
This package restructures your Gemini output into a simpler local project:

frontend/ = local React/Vite app with the NFIF-style dark UI scaffold.

worker/ = Python CFTC worker from Gemini.

1) Frontend setup
Open terminal in frontend/ and run:

bash
npm install
npm run dev
Then open:

http://localhost:3000

Notes:

This frontend is currently a polished mock UI scaffold.

It does not use your OpenAI key yet.

That is intentional, so your key is not exposed in the browser.

2) Worker setup
Open terminal in worker/ and run:

bash
pip install -r requirements.txt
Copy .env.example to .env.local and fill in your Postgres connection:

text
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/cot_db
Then run:

bash
python cot_python_worker.py
3) What is mock vs real
Real now
Python worker downloads weekly CFTC text files.

Python worker can write simplified analytics rows into Postgres.

Mock now
Frontend heatmaps, signals, macro text, releases, and news are mock data.

No frontend-to-Postgres connection yet.

No secure backend OpenAI route yet.

4) API key
Do not put OPENAI_API_KEY into the frontend UI.

When we add a backend server/API route, the key should go into a server-side env file only, for example:

text
OPENAI_API_KEY=your_real_key_here