const express = require('express');
<<<<<<< HEAD
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram Bot Bilgileri (Senin Bot ve Chat ID'n)
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
            res.json({ success: true, message: 'Talebiniz alınmıştır. Yetkili kişinin sizinle iletişime geçmesini bekleyiniz.' });
        } else {
            res.json({ success: false, message: 'Bir hata oluştu.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

app.listen(PORT, () => {
    console.log(`DRKHack sunucusu aktif: http://localhost:${PORT}`);
});
=======
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const axios = require('axios');
const { Telegraf } = require('telegraf');

app.use(express.static('public'));

const CHANNELS_FILE = 'channels.json';
const USERS_FILE = 'users.json';
const TELEGRAM_TOKEN = '8620839293:AAGPzMmkxHF-MiyPhwi-h_8ssxEdy7xX8eY';
const CHAT_ID = '7085777257';

const bot = new Telegraf(TELEGRAM_TOKEN);

// --- VERİ YARDIMCILARI ---
function getChannels() {
    if (!fs.existsSync(CHANNELS_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8') || '[]'); } catch(e) { return []; }
}

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) { fs.writeFileSync(USERS_FILE, '{}'); return {}; }
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}'); } catch(e) { return {}; }
}

// --- TELEGRAM BOT (ONAY SİSTEMİ) ---
bot.command(/onay_(.+)/, (ctx) => {
    const channelName = ctx.match[1].trim();
    let channels = getChannels();
    
    // Eğer kanal yoksa ekle ve dosyasını oluştur
    if (!channels.find(c => c.name === channelName)) {
        channels.push({ name: channelName });
        fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
        
        // Kanalın mesaj dosyası yoksa oluştur
        const msgFile = `messages_${channelName}.json`;
        if (!fs.existsSync(msgFile)) {
            fs.writeFileSync(msgFile, '[]');
        }
        
        // Tüm kullanıcılara yeni listeyi gönder
        io.emit('load-all-channels', channels);
        ctx.reply(`✅ ${channelName} kanalı açıldı ve sisteme eklendi.`);
    } else {
        ctx.reply(`⚠️ ${channelName} zaten mevcut.`);
    }
});
bot.launch();

// --- SOCKET İŞLEMLERİ ---
io.on('connection', (socket) => {
    
    // 1. Giriş Kontrolü
    socket.on('check-user', (email) => {
        const users = readUsers();
        if (users[email]) {
            socket.emit('user-found', users[email]);
        } else {
            socket.emit('user-not-found');
        }
    });

    socket.on('yeni-uye', (data) => {
        let users = readUsers();
        users[data.email] = { username: data.username, email: data.email };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    });

    // 2. Kanal İşlemleri
    socket.on('get-all-channels', () => socket.emit('load-all-channels', getChannels()));

    socket.on('get-history', (channelName) => {
        const file = `messages_${channelName}.json`;
        if (fs.existsSync(file)) {
            socket.emit('load-history', JSON.parse(fs.readFileSync(file, 'utf8')));
        }
    });

    socket.on('chat-mesaj', (data) => {
        const filename = `messages_${data.channel}.json`;
        let messages = [];
        if (fs.existsSync(filename)) {
            try {
                messages = JSON.parse(fs.readFileSync(filename, 'utf8'));
            } catch(e) { messages = []; }
        }
        
        const yeniMesaj = { username: data.username, mesaj: data.mesaj, time: new Date().toLocaleTimeString() };
        messages.push(yeniMesaj);
        fs.writeFileSync(filename, JSON.stringify(messages, null, 2));
        
        // Sadece mesajı gönder, client tarafında script.js'de tek bir ekleme yapılması yeterli
        io.emit('yeni-mesaj', data);
    });

    // 3. Kanal Başvuru
    socket.on('kanal-basvuru', async (data) => {
        try {
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: `📩 YENİ KANAL TALEBİ\nKanal: ${data.channelName}\nSahibi: ${data.username}\nE-posta: ${data.email}\n\n✅ Onay için: /onay_${data.channelName}`
            });
        } catch (e) { console.error("Telegram Gönderim Hatası:", e); }
    });
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor`);
});
