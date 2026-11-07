import { LIBS } from "../shared/libs.js";
import { posisiPetak, petakDiblok } from "./arena.js";

// penggerak buat 1 bomber: nyimpen antrian perintah gerak, tiap frame ngatur posisi tempatnya
//
// cara pakai di main.js:
//   var gerak = new Penggerak(tempatFabio, -2, 0);  // taruh di petak (-2, 0)
//   gerak.jalanKe(-2, 3, 2);   // jalan ke petak (-2, 3) selama 2 detik
//   gerak.diam(1);             // diem 1 detik
//   gerak.hadap(180, 0.5);     // muter ngadep 180 derajat (belakang) selama 0.5 detik
//   gerak.ulang = true;        // kalau perintahnya udah habis, ulang dari awal
//   terus di animasi: gerak.update(time);
//
// arah dalam derajat: 0 = ngadep depan (ke kamera awal), 90 = kanan, 180 = belakang, -90 = kiri
export class Penggerak {
    constructor(tempat, x, y, skala) {
        this.tempat = tempat;
        this.skala = skala || 1;
        this.x = x;
        this.y = y;
        this.arah = 0;
        this.daftar = [];
        this.urutan = 0;     // lagi ngerjain perintah ke berapa
        this.mulai = null;   // detik perintah yang sekarang mulai
        this.awal = null;    // posisi & arah pas perintah yang sekarang mulai
        this.ulang = false;
        this.pasang();
    }

    jalanKe(x, y, detik) {
        if (petakDiblok(x, y)) console.warn("petak (" + x + ", " + y + ") itu tembok / pilar");
        this.daftar.push({ jenis: "jalan", x: x, y: y, detik: detik });
        return this;
    }

    diam(detik) {
        this.daftar.push({ jenis: "diam", detik: detik });
        return this;
    }

    hadap(derajat, detik) {
        this.daftar.push({ jenis: "hadap", arah: derajat, detik: detik || 0.3 });
        return this;
    }

    update(time) {
        var t = time / 1000;

        if (this.urutan >= this.daftar.length) {
            if (!this.ulang || this.daftar.length == 0) return;
            this.urutan = 0;
        }

        var p = this.daftar[this.urutan];

        // perintah baru mulai: catet waktu sama posisi awalnya
        if (this.mulai === null) {
            this.mulai = t;
            this.awal = { x: this.x, y: this.y, arah: this.arah };

            // kalau jalan, langsung ngadep ke arah jalannya
            if (p.jenis == "jalan") {
                var dx = p.x - this.x, dy = p.y - this.y;
                if (dx != 0 || dy != 0) this.arah = Math.atan2(dx, -dy) * 180 / Math.PI;
            }
        }

        // k = udah berapa persen perintahnya jalan (0 sampai 1)
        var k = p.detik > 0 ? Math.min((t - this.mulai) / p.detik, 1) : 1;

        if (p.jenis == "jalan") {
            this.x = this.awal.x + (p.x - this.awal.x) * k;
            this.y = this.awal.y + (p.y - this.awal.y) * k;
        } else if (p.jenis == "hadap") {
            this.arah = this.awal.arah + (p.arah - this.awal.arah) * k;
        }

        if (k >= 1) {
            this.urutan++;
            this.mulai = null;
        }

        this.pasang();
    }

    // tulis posisi, arah, sama skala ke MOVEMATRIX tempatnya
    pasang() {
        var pos = posisiPetak(this.x, this.y);
        var m = this.tempat.MOVEMATRIX;
        LIBS.set_I4(m);
        LIBS.scale(m, this.skala, this.skala, this.skala);
        LIBS.rotateY(m, this.arah * Math.PI / 180);
        LIBS.set_position(m, pos.x, 0, pos.z);
    }
}
