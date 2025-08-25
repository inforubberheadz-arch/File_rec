import express from 'express';
import cors from 'cors';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer();
app.use(cors());

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto' });

    const formData = new FormData();
    
    // MODIFICA IMPORTANTE: Aggiungi il file correttamente
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Aggiungi metadata opzionale
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
