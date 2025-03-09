const express = require('express');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/check-eligibility', async (req, res) => {
  console.log('Request received:', req.body);
  const { jobDescription, resumeText } = req.body;

  // Define stop words to ignore
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'to', 'in', 'is', 'you', 'can', 'also', 'our', 'id'];

  // Function to clean and tokenize text
  const tokenize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2 && !stopWords.includes(word) && !word.includes('@')); // Remove short words, stop words, and emails
  };

  const jobKeywords = tokenize(jobDescription);
  const resumeKeywords = tokenize(resumeText);

  // Find matches
  const matches = jobKeywords.filter(word => resumeKeywords.includes(word));
  const score = jobKeywords.length > 0 ? (matches.length / jobKeywords.length) * 100 : 0;

  console.log('Job Keywords:', jobKeywords);
  console.log('Resume Keywords:', resumeKeywords);
  console.log('Matches:', matches);

  res.json({ score: Math.min(score, 100).toFixed(2) });
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});