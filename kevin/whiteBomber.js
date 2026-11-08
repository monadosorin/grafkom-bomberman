import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid, buatTabung, buatOvoid, buatFrustum,
    buatKapsul, buatHiperboloid2, buatLingkaran, buatKotak,
    buatTorus, buatParaboloid
} from "../shared/bentuk.js";

// disimpen di luar biar bisa diubah di animasi
var badan, pinggulKiri, pinggulKanan, bahuKiri, bahuKanan, antena;

// warna
var MERAH = [0.9, 0.3, 0.45];
var PUTIH = [1, 1, 1];
var BIRU  = [0.2, 0.2, 0.9];
var HITAM = [0, 0, 0];
var KULIT = [0.9, 0.7, 0.5];
var KUNING = [0.9, 0.9, 0];

export function buatWhiteBomber(GL) {
    // root di tanah (y = 0), kosong
    var root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 0.8, 0);

    // -------------------------------------TORSO----------------------------------------------
    // torso biru
    var torsoBiru = buatOvoid(0.3, 0.4, 0.3, 0.28, 20, 20);
    badan = new Objek(GL, torsoBiru.vertex, torsoBiru.faces, BIRU);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.1, 0);
    root.addChild(badan);

    // sabuk hitam
    var sh = buatTabung(0.32, 0.1, 20);
    var sabukHitam = new Objek(GL, sh.vertex, sh.faces, HITAM);
    LIBS.set_position(sabukHitam.MOVEMATRIX, 0, -0.2, 0);
    badan.addChild(sabukHitam);

    // belt buckle kuning
    var bb = buatKotak(0.15, 0.1, 0.02);
    var beltBuckle = new Objek(GL, bb.vertex, bb.faces, KUNING);
    LIBS.set_position(beltBuckle.MOVEMATRIX, 0, 0.05, 0.33);
    sabukHitam.addChild(beltBuckle);

    // belt buckle hitam dalam
    var bb2 = buatKotak(0.1, 0.05, 0.02);
    var beltBuckleHitam = new Objek(GL, bb2.vertex, bb2.faces, HITAM);
    LIBS.set_position(beltBuckleHitam.MOVEMATRIX, 0, 0.05, 0.331);
    sabukHitam.addChild(beltBuckleHitam);

    // -------------------------------------KEPALA----------------------------------------------
    // pivot kepala
    var kepala = new Objek(GL);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.8, 0);
    badan.addChild(kepala);

    // helm
    var h = buatKapsul(0.454, 0.28, 0.35, 0.2, 20, 20);
    var helm = new Objek(GL, h.vertex, h.faces, PUTIH);
    LIBS.set_position(helm.MOVEMATRIX, 0, 0, -0.06);
    kepala.addChild(helm);

    // lis hitam muka
    var l = buatHiperboloid2(1.3, 2, 1, 0.3, 20, 20);
    var lisHitam = new Objek(GL, l.vertex, l.faces, HITAM);
    LIBS.set_position(lisHitam.MOVEMATRIX, 0, 0, -1.8);
    LIBS.rotateX(lisHitam.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(lisHitam);

    // muka
    var m = buatHiperboloid2(1.3, 1.9, 1, 0.3, 20, 20);
    var muka = new Objek(GL, m.vertex, m.faces, KULIT);
    LIBS.set_position(muka.MOVEMATRIX, 0, 0, 2.25);
    LIBS.rotateX(muka.MOVEMATRIX, -Math.PI / 2);
    kepala.addChild(muka);

    // mata
    var ma = buatLingkaran(0.03, 0.2, 20);
    var mataKiri = new Objek(GL, ma.vertex, ma.faces, HITAM);
    var mataKanan = new Objek(GL, ma.vertex, ma.faces, HITAM);
    LIBS.set_position(mataKiri.MOVEMATRIX, -0.15, 0, 0.35);
    LIBS.set_position(mataKanan.MOVEMATRIX, 0.15, 0, 0.35);
    LIBS.rotateX(mataKiri.MOVEMATRIX, Math.PI / 2);
    LIBS.rotateX(mataKanan.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(mataKiri);
    kepala.addChild(mataKanan);

    // helm torus
    var ht = buatTorus(0.43, 0.34, 0.07, 0.3, 20, 20);
    var helmTorus = new Objek(GL, ht.vertex, ht.faces, PUTIH);
    LIBS.set_position(helmTorus.MOVEMATRIX, 0, 0, 0.05);
    LIBS.rotateX(helmTorus.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(helmTorus);

    // antena
    antena = new Objek(GL);
    LIBS.set_position(antena.MOVEMATRIX, 0, 0.3, -0.3);
    kepala.addChild(antena);

    var tk = buatFrustum(0.03, 0.04, 0.3, 20, 20);
    var frustumKepala = new Objek(GL, tk.vertex, tk.faces, PUTIH);
    LIBS.rotateX(frustumKepala.MOVEMATRIX, -Math.PI / 4);
    antena.addChild(frustumKepala);

    var bk = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var bolaKepala = new Objek(GL, bk.vertex, bk.faces, MERAH);
    LIBS.set_position(bolaKepala.MOVEMATRIX, 0, 0.3, -0.3);
    antena.addChild(bolaKepala);

    // -------------------------------------TANGAN----------------------------------------------
    var tanganGeom = buatFrustum(0.03, 0.1, 0.5, 20, 20);
    var bolaTanganGeom = buatEllipsoid(0.16, 0.16, 0.16, 20, 20);

    bahuKiri = new Objek(GL);
    bahuKanan = new Objek(GL);
    badan.addChild(bahuKiri);
    badan.addChild(bahuKanan);

    // lengan kiri
    var tanganKiri = new Objek(GL, tanganGeom.vertex, tanganGeom.faces, PUTIH);
    LIBS.rotateX(tanganKiri.MOVEMATRIX, Math.PI);
    bahuKiri.addChild(tanganKiri);

    var bolaTanganKiri = new Objek(GL, bolaTanganGeom.vertex, bolaTanganGeom.faces, MERAH);
    LIBS.set_position(bolaTanganKiri.MOVEMATRIX, 0, 0.50, 0);
    tanganKiri.addChild(bolaTanganKiri);

    // lengan kanan
    var tanganKanan = new Objek(GL, tanganGeom.vertex, tanganGeom.faces, PUTIH);
    LIBS.rotateX(tanganKanan.MOVEMATRIX, Math.PI);
    bahuKanan.addChild(tanganKanan);

    var bolaTanganKanan = new Objek(GL, bolaTanganGeom.vertex, bolaTanganGeom.faces, MERAH);
    LIBS.set_position(bolaTanganKanan.MOVEMATRIX, 0, 0.50, 0);
    tanganKanan.addChild(bolaTanganKanan);

    // -------------------------------------KAKI----------------------------------------------
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    badan.addChild(pinggulKiri);
    badan.addChild(pinggulKanan);

    var kk = buatFrustum(0.05, 0.10, 0.5, 20, 20);
    var kakiKiri = new Objek(GL, kk.vertex, kk.faces, PUTIH);
    var kakiKanan = new Objek(GL, kk.vertex, kk.faces, PUTIH);
    LIBS.rotateX(kakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateX(kakiKanan.MOVEMATRIX, Math.PI);
    pinggulKiri.addChild(kakiKiri);
    pinggulKanan.addChild(kakiKanan);

    var bolaKaki = buatEllipsoid(0.15, 0.15, 0.15, 20, 20);
    var ujungKaki = buatParaboloid(0.14, 0.28, 0.14, 20, 20);

    var bolaKakiKiri = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, MERAH);
    var bolaKakiKanan = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, MERAH);
    LIBS.set_position(bolaKakiKiri.MOVEMATRIX, 0, 0.5, 0);
    LIBS.set_position(bolaKakiKanan.MOVEMATRIX, 0, 0.5, 0);
    LIBS.rotateY(bolaKakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateY(bolaKakiKanan.MOVEMATRIX, Math.PI);
    kakiKiri.addChild(bolaKakiKiri);
    kakiKanan.addChild(bolaKakiKanan);

    var ujungKakiKiri = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, MERAH);
    var ujungKakiKanan = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, MERAH);
    LIBS.set_position(ujungKakiKiri.MOVEMATRIX, 0, 0, 0.3);
    LIBS.set_position(ujungKakiKanan.MOVEMATRIX, 0, 0, 0.3);
    LIBS.rotateX(ujungKakiKiri.MOVEMATRIX, -Math.PI / 2);
    LIBS.rotateX(ujungKakiKanan.MOVEMATRIX, -Math.PI / 2);
    bolaKakiKiri.addChild(ujungKakiKiri);
    bolaKakiKanan.addChild(ujungKakiKanan);

    // pose awal (diem), langsung pake animasi di waktu 0
    animasiWhiteBomber(0, false, false);

    return root;
}

// 0 = diem, 1 = jalan penuh. berubahnya pelan2 biar pindah dari jalan ke diem ga patah
var faktorJalan = 0;
var faktorLempar = 0;
var waktuSebelum = 0;

// sedangJalan = true kalau lagi jalan, false kalau lagi diem (dikasih dari penggerak di main.js)
// sedangLempar = true kalau lagi lempar bom
// kalau ga dikasih (misal di preview.html), otomatis ganti-ganti sendiri
export function animasiWhiteBomber(time, sedangJalan, sedangLempar) {
    var t = time / 1000;
    var dt = Math.min(Math.max(t - waktuSebelum, 0), 0.1);
    waktuSebelum = t;

    // Default testing jika dipanggil tanpa parameter
    if (sedangJalan === undefined) sedangJalan = (t % 5) < 3;
    if (sedangLempar === undefined) sedangLempar = false;

    // faktor transisi halus
    var targetJalan = sedangJalan ? 1 : 0;
    faktorJalan += (targetJalan - faktorJalan) * Math.min(dt * 8, 1);
    var faktorDiem = 1 - faktorJalan;

    var targetLempar = sedangLempar ? 1 : 0;
    faktorLempar += (targetLempar - faktorLempar) * Math.min(dt * 10, 1);

    // ayunan langkah kaki
    var langkah = t * 2 * Math.PI * 0.9;
    var ayun = Math.sin(langkah) * 0.4 * faktorJalan * (1 - faktorLempar);

    // napas pas diem
    var napas = Math.sin(t * 2.5);

    // kaki kiri kanan gantian
    LIBS.set_I4(pinggulKiri.MOVEMATRIX);
    LIBS.rotateX(pinggulKiri.MOVEMATRIX, ayun);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.16, -0.35, 0);

    LIBS.set_I4(pinggulKanan.MOVEMATRIX);
    LIBS.rotateX(pinggulKanan.MOVEMATRIX, -ayun);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.16, -0.35, 0);

    // tangan:
    // - buka ke samping pas diem (ikut napas pelan)
    // - ayun maju-mundur pas jalan
    // - angkat ke depan-atas pas lempar bom
    var buka = 0.25 + napas * 0.04 * faktorDiem;
    var ayunTangan = -ayun * 0.9 * (1 - faktorLempar);
    var rotasiLempar = -1.2 * faktorLempar; // lempar ke depan

    LIBS.set_I4(bahuKiri.MOVEMATRIX);
    LIBS.rotateZ(bahuKiri.MOVEMATRIX, -buka);
    LIBS.rotateX(bahuKiri.MOVEMATRIX, ayunTangan + rotasiLempar);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.20, 0.18, 0);

    LIBS.set_I4(bahuKanan.MOVEMATRIX);
    LIBS.rotateZ(bahuKanan.MOVEMATRIX, buka);
    LIBS.rotateX(bahuKanan.MOVEMATRIX, -ayunTangan + rotasiLempar);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.20, 0.18, 0);

    // badan: naik-turun tiap langkah & napas pas diem + condong dikit pas lempar
    var naik = Math.abs(Math.sin(langkah)) * 0.035 * faktorJalan + (napas + 1) * 0.01 * faktorDiem;
    LIBS.set_I4(badan.MOVEMATRIX);
    LIBS.rotateX(badan.MOVEMATRIX, 0.08 * faktorJalan + 0.15 * faktorLempar);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.1 + naik, 0);

    // antena goyang
    if (antena) {
        LIBS.set_I4(antena.MOVEMATRIX);
        LIBS.rotateZ(antena.MOVEMATRIX, Math.sin(t * 3) * (0.08 + 0.1 * faktorJalan));
        LIBS.set_position(antena.MOVEMATRIX, 0, 0.3, -0.3);
    }
}