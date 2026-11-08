# Chat.onezal v1 — login & intro
Tambahan:
- Halaman awal untuk membuat username, password, konfirmasi password, dan centang "Saya bukan bot".
- Banner ONEZAL di bagian atas halaman masuk.
- Logo kecil bundar ONEZAL di header/profil.
- Setelah konfirmasi, video intro diputar; tombol SKIP di kanan atas.
- Akun demo khusus: username `Rijal`, password `221101`.

PENTING KEAMANAN:
Login ini masih gerbang demo berbasis browser/localStorage. Username/password dan data akun tidak aman untuk layanan publik dan tidak disinkronkan antarperangkat. Jangan gunakan password pribadi yang dipakai di akun lain. Untuk produksi, ganti dengan Firebase Authentication (Email/Password), validasi server-side/Firestore Rules, dan jangan simpan password sendiri di localStorage atau kode JavaScript.

Untuk fitur chat online lintas perangkat tetap perlu mengisi `firebaseConfig` di `app.js`, mengaktifkan Firebase Authentication, Firestore, Storage, dan menyiapkan Security Rules aman. Mode demo tanpa Firebase hanya menyimpan data pada browser ini.


## Badge kreator ONEZAL
- Akun `Rijal` dengan password demo `221101` dicadangkan sebagai akun kreator.
- Badge centang biru khusus ONEZAL muncul di samping nama Rijal pada profil dan pesan grup.
- Badge ini adalah penanda kreator buatan aplikasi, bukan verifikasi dari WhatsApp atau platform lain.

**Penting:** login yang ada masih demo sisi browser. Pengecekan username/password di JavaScript bukan keamanan produksi dan tidak dapat mencegah penyamaran akun di website publik. Sebelum diluncurkan, akun Rijal harus diamankan lewat Firebase Authentication dan aturan database yang memverifikasi UID kreator di server.


## Perbaikan halaman awal
- Class `.hide` sekarang didefinisikan agar halaman login dan layar video benar-benar bisa disembunyikan.
- Halaman login tampil terlebih dahulu, dengan banner ONEZAL di atas kolom username/password.
- Setelah checkbox konfirmasi bot dicentang dan tombol ditekan, video intro muncul.
- Tombol SKIP berada di kanan atas video dan langsung menutup intro.
- Badge centang biru menggunakan siluet biru dari gambar referensi (latar kotak-kotak transparan), bukan gambar kotak-kotak utuh.

Catatan: akun Rijal di versi ini masih validasi demo pada JavaScript/browser. Jangan anggap sebagai login publik yang aman sebelum autentikasi server/Firebase dikonfigurasi.


## Konfigurasi Firebase
Konfigurasi proyek Firebase `chatonezal` sudah dimasukkan ke `app.js` menggunakan Firebase Web SDK versi CDN. Tidak perlu menambahkan import `firebase/app` dari npm secara terpisah. Pastikan Authentication (Anonymous), Firestore, dan Storage sudah diaktifkan serta Firestore/Storage Rules sudah disiapkan dengan aman.
