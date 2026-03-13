import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ADZUNA_APP_ID = process.env.VITE_ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.VITE_ADZUNA_APP_KEY;
const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=5&content-type=application/json`;

fetch(url)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
