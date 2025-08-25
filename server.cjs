const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CONFIGURA CORS CORRETTAMENTE
const corsOptions = {
  origin: ['https://chimerical-douhua-121b2a.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Abilita preflight requests

const upload = multer();

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Aggiungi headers CORS anche nella response
    res.header('Access-Control-Allow-Origin', 'https://chimerical-douhua-121b2a.netlify.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto' });

    const formData = new FormData();
    
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const metadata = JSON.stringify({
      name: req.file.originalname,
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Errore Pinata',
        details: data 
      });
    }

    res.json({ IpfsHash: data.IpfsHash });
  } catch (err) {
    console.error('Errore upload:', err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend File Recorder su porta ${port}`));
