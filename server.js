const express = require('express');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const stopWords = ['the', 'a', 'an', 'and', 'or', 'to', 'in', 'is', 'you', 'can', 'also', 'our', 'id'];

// Enhanced tokenize function with normalization
const tokenize = (text) => {
  console.log('Raw text before tokenization:', text); // Debug raw input
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation except hyphens (for "2-years")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word) && !word.includes('@'));
};

app.post('/check-eligibility', upload.single('resumeFile'), async (req, res) => {
  console.log('Received request:', req.body, 'File:', req.file ? 'Uploaded' : 'No file');
  try {
    const { jobDescription } = req.body;
    let resumeText = req.body.resumeText;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Handle PDF upload if provided
    if (req.file) {
      console.log('Processing PDF file...');
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
      console.log('Extracted PDF text:', resumeText); // Debug PDF output
    } else if (!resumeText) {
      return res.status(400).json({ error: 'Resume text or file is required' });
    }

    const jobKeywords = tokenize(jobDescription);
    const resumeKeywords = tokenize(resumeText);

    console.log('Job Keywords:', jobKeywords);
    console.log('Resume Keywords:', resumeKeywords);

    const matches = jobKeywords.filter(word => resumeKeywords.includes(word));
    const score = jobKeywords.length > 0 ? (matches.length / jobKeywords.length) * 100 : 0;

    console.log('Matches:', matches);
    console.log('Calculated Score:', score);

    res.json({
      score: Math.min(score, 100).toFixed(2),
      jobKeywords: jobKeywords,
      resumeKeywords: resumeKeywords,
      matches: matches
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Server running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});