RIMBARA AI V8.3 FIX4

Ganti HANYA dua file berikut di GitHub:
1. app-v7.js (root)
2. api/realtime/call.js

Perbaikan FIX4:
- tidak memakai getSecret() di browser
- SDP dikirim sebagai multipart/form-data field "sdp" dengan Content-Type application/sdp
- session dikirim sebagai field JSON
- API key tetap hanya di server

Setelah commit, tunggu Vercel deploy selesai lalu Ctrl+F5 pada:
https://rimbara-ai.vercel.app

Kemudian tekan Start Live Conversation.
