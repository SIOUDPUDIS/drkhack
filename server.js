const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Telegram Bot Bilgileri
const TELEGRAM_BOT_TOKEN = '8918601161:AAGceVGe7oMItGfXFJhhrxMQvA3j060nQEs';
const TELEGRAM_CHAT_ID = '7085777257';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Statik dosyaları sun (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Engellenen IP Listesi
const blockedIps = ['123.45.67.89']; 

// IP Kontrolü ve Ziyaret Middleware
app.use(async (req, res, next) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    if (blockedIps.includes(clientIp)) {
        return res.status(403).send('<h1>Erişim Engellendi</h1><p>Bu sunucuya bağlanma yetkiniz yok.</p>');
    }

    next();
});

// Sunucu Sağlık Kontrolü Endpoint'i
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'online' });
});

// Formdan gelen talepleri Telegram'a iletme endpoint'i
app.post('/api/talep', async (req, res) => {
    const { message, contact } = req.body;
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const telegramText = `🔥 DRKHack - Yeni Talep!\n\n💬 İstek: ${message}\n📞 İletişim: ${contact}\n🌐 IP: ${clientIp}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegramText })
        });

        if (response.ok) {
            res.json({ success: true, message: 'Talebiniz alınmıştır.' });
        } else {
            res.json({ success: false, message: 'Bir hata oluştu.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});