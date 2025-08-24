require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

async function uploadToPinata(fileBuffer, fileName) {
  const formData = new FormData();
  formData.append('file', fileBuffer, { filename: fileName });

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT}`
    },
    body: formData
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Pinata upload error (${res.status}): ${txt}`);
  }

  const data = await res.json();
  return data.IpfsHash;
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const cid = await uploadToPinata(req.file.buffer, req.file.originalname);
    res.json({ cid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
