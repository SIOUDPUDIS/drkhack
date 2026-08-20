const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Telegram Bot Bilgileri (Süper Grup ID Güncellendi)
const TELEGRAM_BOT_TOKEN = '8918601161:AAGceVGe7oMItGfXFJhhrxMQvA3j060nQEs';
const TELEGRAM_CHAT_ID = '-1004325405637';

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

// Formdan gelen talepleri Telegram grubuna iletme endpoint'i
app.post('/api/talep', async (req, res) => {
    const { category, urgency, platform, contact, message } = req.body;
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    // Telegram grubuna gidecek profesyonel operasyon raporu şablonu
    const telegramText = 
`🚨 **YENİ OPERASYON TALEBİ!** 🚨
━━━━━━━━━━━━━━━━━━
📌 **Kategori:** ${category || 'Belirtilmedi'}
⚡ **Aciliyet:** ${urgency || 'Normal'}
📱 **İletişim Kanalı:** ${platform || 'Belirtilmedi'}
🔗 **Kullanıcı / Link:** ${contact}
💬 **Detay:** ${message}
🌐 **IP:** ${clientIp}
━━━━━━━━━━━━━━━━━━
*DRKHACK yönlendirme sistemi*`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: TELEGRAM_CHAT_ID, 
                text: telegramText,
                parse_mode: 'Markdown' 
            })
        });

        const responseData = await response.json();

        if (response.ok && responseData.ok) {
            res.json({ success: true, message: 'Operasyon talebi başarıyla iletildi.' });
        } else {
            console.error("Telegram API Hatası:", responseData);
            res.json({ success: false, message: 'Telegram API hatası: ' + (responseData.description || 'Bilinmiyor') });
        }
    } catch (error) {
        console.error("Sunucu İstek Hatası:", error);
        res.status(500).json({ success: false, message: 'Sunucu hatası: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`DRK Teknoloji Sunucusu ${PORT} portunda aktif!`);
});