let audioCtx = null;

// Kullanıcı sayfada fareyi hareket ettirdiği veya herhangi bir tuşa bastığı an arka planda ses motorunu otomatik uyandır
const unlockAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    // Tetiklendikten sonra dinleyicileri kaldır ki bir daha boşuna çalışmasın
    window.removeEventListener('mousemove', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
};

window.addEventListener('mousemove', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
window.addEventListener('touchstart', unlockAudio, { once: true });

function playKeyClick() {
    try {
        if (!audioCtx) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square'; 
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        // Hata olursa geç
    }
}

// Formu dinle ve yeni operasyon verilerini topla
document.getElementById('hack-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const category = document.getElementById('op-category').value;
    const urgency = document.getElementById('op-urgency').value;
    const platform = document.getElementById('user-platform').value;
    const contact = document.getElementById('user-contact').value;
    const message = document.getElementById('user-message').value;
    const statusDiv = document.getElementById('response-status');

    // Gönderim başladığında kullanıcıya bilgi ver
    statusDiv.style.color = "#00ff66";
    statusDiv.innerHTML = "[+] Operasyon şifreleniyor ve kuyruğa ekleniyor...";

    const payload = { category, urgency, platform, contact, message };

    try {
        const response = await fetch('/api/talep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.success) {
            statusDiv.innerHTML = "[✓] İşlem başarılı! Talep ekibe iletildi.";
            document.getElementById('hack-form').reset();
        } else {
            statusDiv.style.color = "#ff0055";
            statusDiv.innerHTML = "[!] Sistem hatası: Veri iletilemedi.";
        }
    } catch (err) {
        document.getElementById('connection-error').classList.remove('hidden');
    }
});

// Arka planda sunucuyu sürekli kontrol et
setInterval(async () => {
    try {
        const res = await fetch('/api/health');
        if (!res.ok) document.getElementById('connection-error').classList.remove('hidden');
    } catch (e) {
        document.getElementById('connection-error').classList.remove('hidden');
    }
}, 5000);

// Yan Pencere Yazıları (Daktilo Efekti + Sesli)
const textLeft = "> [+] DRK Teknoloji Operasyon Merkezi...\n> [!] Hızlı işlem modu aktif.\n> [status] Veri transferi şifrelendi.\n> [INFO] Talebi ilet, ekibimiz yönlendirsin.";
const textRight = "> [!] Kategori ve aciliyet derecesini seç.\n> [+] Sistem veriyi doğrudan işleyecek.\n> [?] Başka bir şeye ihtiyacın olursa buradayız.";

function typeWriter(text, elementId, speed = 40) {
    let i = 0;
    function type() {
        if (i < text.length) {
            const char = text.charAt(i);
            document.getElementById(elementId).innerHTML += char === '\n' ? '<br>' : char;
            
            if (char !== ' ' && char !== '\n') {
                playKeyClick();
            }

            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

setTimeout(() => {
    typeWriter(textLeft, 'typewriter-left', 35);
    typeWriter(textRight, 'typewriter-right', 35);
}, 2500);

// --- 3. CANLI PİNG SAYACI ---
setInterval(() => {
    const pingText = document.getElementById('ping-text');
    if (pingText) {
        const randomPing = Math.floor(Math.random() * (35 - 12 + 1)) + 12;
        pingText.innerHTML = randomPing + 'ms';
    }
}, 3000);

// --- 4. RASTGELE EKRAN GLİTCH (BOZULMA) EFEKTİ ---
function triggerGlitch() {
    const body = document.body;
    body.classList.add('glitch-active');
    
    setTimeout(() => {
        body.classList.remove('glitch-active');
    }, 150);
}

setInterval(() => {
    triggerGlitch();
}, Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000);