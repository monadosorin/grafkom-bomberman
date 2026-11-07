import { LIBS } from "../shared/libs.js";
import { posisiPetak, petakDiblok } from "./arena.js";

// penggerak buat 1 bomber: nyimpen antrian perintah gerak, tiap frame ngatur posisi tempatnya
//
// cara pakai di main.js:
//   var gerak = new Penggerak(tempatFabio, -2, 0);       // taruh di petak (-2, 0), ngadep depan
//   var gerak = new Penggerak(tempatNick, 2, 0, 1.5, -90); // skala 1.5, ngadep kiri
//   gerak.jalanKe(-2, 3, 2);   // jalan ke petak (-2, 3) selama 2 detik
//   gerak.diam(1);             // diem 1 detik
//   gerak.hadap(180, 0.5);     // muter ngadep 180 derajat (belakang) selama 0.5 detik
//   gerak.sampai(10);          // diem sampe detik ke-10 dari awal scene (buat nyamain waktu antar bomber)
//   gerak.lempar(bom, 0, 2, 1.4, 2);  // lempar bom ke petak (0, 2) selama 1.4 detik, meledak 2 detik abis mendarat
//   gerak.ulang = true;        // kalau perintahnya udah habis, ulang dari awal
//   terus di animasi: gerak.update(time);
//   gerak.jalan = true kalau lagi jalan, false kalau lagi diem / muter, bisa dikasih ke animasi bomber
//   gerak.lagiLempar = true kalau bom nya lagi diangkat (tangan naik), bisa dikasih ke animasi bomber juga
//
// arah dalam derajat: 0 = ngadep depan (bawah di peta), 90 = kanan, 180 = belakang (atas di peta), -90 = kiri

// tinggi bom pas diangkat di atas kepala, sama tinggi puncak lengkungan lemparan
var TINGGI_ANGKAT = 2.2;
var TINGGI_LEMPAR = 3.5;

// posisi bom selama lemparan, k = 0 sampai 1
// 0 - 0.25   : diangkat dari tangan ke atas kepala
// 0.25 - 0.85: terbang melengkung (parabola) ke petak tujuan
// 0.85 - 1   : mantul dikit di petak tujuan
function gerakinBom(p, k, darix, dariy, skala) {
    var dari = posisiPetak(darix, dariy);
    var ke = posisiPetak(p.x, p.y);
    var x, y, z;

    if (k < 0.25) {
        // naik dari tinggi tangan (setengah) ke atas kepala
        var a = k / 0.25;
        x = dari.x;
        z = dari.z;
        y = (TINGGI_ANGKAT * 0.5 + TINGGI_ANGKAT * 0.5 * a) * skala;
    } else if (k < 0.85) {
        // a = 0 sampai 1 sepanjang terbangnya
        // tinggi = garis lurus dari atas kepala ke lantai + parabola 4a(1-a) biar melengkung
        var a = (k - 0.25) / 0.6;
        x = dari.x + (ke.x - dari.x) * a;
        z = dari.z + (ke.z - dari.z) * a;
        y = TINGGI_ANGKAT * skala * (1 - a) + TINGGI_LEMPAR * 4 * a * (1 - a);
    } else {
        // mantul kecil: setengah gelombang sin
        var a = (k - 0.85) / 0.15;
        x = ke.x;
        z = ke.z;
        y = Math.sin(a * Math.PI) * 0.4;
    }

    p.bom.taruh(x, y, z);
}

// selisih sudut paling pendek dari a ke b (derajat), hasilnya -180 sampai 180
function selisihSudut(a, b) {
    var d = (b - a) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
}

export class Penggerak {
    constructor(tempat, x, y, skala, arah) {
        this.tempat = tempat;
        this.skala = skala || 1;
        this.x = x;
        this.y = y;
        this.arah = arah || 0;
        this.daftar = [];
        this.urutan = 0;         // lagi ngerjain perintah ke berapa
        this.mulai = null;       // detik perintah yang sekarang mulai
        this.awal = null;        // posisi & arah pas perintah yang sekarang mulai
        this.waktuAwal = null;   // detik pertama kali update dipanggil (awal scene)
        this.ulang = false;
        this.jalan = false;      // true kalau lagi ngerjain jalanKe, bisa dikasih ke animasi bomber
        this.lagiLempar = false; // true kalau bom lagi diangkat sebelum dilempar
        this.hilang = false;     // true kalau kena ledakan, bomber nya langsung ga keliatan & berhenti
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

    sampai(detik) {
        this.daftar.push({ jenis: "sampai", waktu: detik, detik: 0 });
        return this;
    }

    // lempar bom (objek Bom) ke petak (x, y): diangkat, terbang melengkung, mantul, terus detak
    // sumbu = berapa detik abis mendarat baru meledak
    lempar(bom, x, y, detik, sumbu) {
        if (petakDiblok(x, y)) console.warn("petak (" + x + ", " + y + ") itu tembok / pilar");
        this.daftar.push({ jenis: "lempar", bom: bom, x: x, y: y, detik: detik || 1.4, sumbu: sumbu || 2 });
        return this;
    }

    update(time) {
        var t = time / 1000;
        if (this.waktuAwal === null) this.waktuAwal = t;

        // udah kena ledakan: ga ngapa2in lagi
        if (this.hilang) {
            this.jalan = false;
            this.lagiLempar = false;
            this.pasang();
            return;
        }

        if (this.urutan >= this.daftar.length) {
            if (!this.ulang || this.daftar.length == 0) {
                this.jalan = false;
                this.lagiLempar = false;
                return;
            }
            this.urutan = 0;
            this.waktuAwal = t;
        }

        var p = this.daftar[this.urutan];
        this.jalan = p.jenis == "jalan";

        // perintah baru mulai: catet waktu sama posisi awalnya
        if (this.mulai === null) {
            this.mulai = t;
            this.awal = { x: this.x, y: this.y, arah: this.arah };

            // kalau jalan / lempar, langsung ngadep ke arah tujuannya
            if (p.jenis == "jalan" || p.jenis == "lempar") {
                var dx = p.x - this.x, dy = p.y - this.y;
                if (dx != 0 || dy != 0) this.arah = Math.atan2(dx, -dy) * 180 / Math.PI;
            }
        }

        // k = udah berapa persen perintahnya jalan (0 sampai 1)
        var k;
        if (p.jenis == "sampai") k = (t - this.waktuAwal) >= p.waktu ? 1 : 0;
        else k = p.detik > 0 ? Math.min((t - this.mulai) / p.detik, 1) : 1;

        if (p.jenis == "jalan") {
            this.x = this.awal.x + (p.x - this.awal.x) * k;
            this.y = this.awal.y + (p.y - this.awal.y) * k;
        } else if (p.jenis == "hadap") {
            // muter lewat jalan yang paling pendek
            this.arah = this.awal.arah + selisihSudut(this.awal.arah, p.arah) * k;
        } else if (p.jenis == "lempar") {
            // tangan naik selama bom masih dipegang (sampe 30% lemparan)
            this.lagiLempar = k < 0.3;
            gerakinBom(p, k, this.x, this.y, this.skala);
            if (k >= 1) p.bom.mendarat(t, p.sumbu, p.x, p.y);
        }

        if (p.jenis != "lempar") this.lagiLempar = false;

        if (k >= 1) {
            this.urutan++;
            this.mulai = null;
        }

        this.pasang();
    }

    // tulis posisi, arah, sama skala ke MOVEMATRIX tempatnya
    // kalau udah hilang skalanya 0 jadi ga keliatan
    pasang() {
        var pos = posisiPetak(this.x, this.y);
        var m = this.tempat.MOVEMATRIX;
        var s = this.hilang ? 0 : this.skala;
        LIBS.set_I4(m);
        LIBS.scale(m, s, s, s);
        LIBS.rotateY(m, this.arah * Math.PI / 180);
        LIBS.set_position(m, pos.x, 0, pos.z);
    }
}
