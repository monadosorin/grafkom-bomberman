import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid, buatKapsul, buatTabung, buatHiperboloid2,
    buatTorus, buatLingkaran, buatKotak, generateBSpline
} from "../shared/bentuk.js";

var badan, pinggulKiri, pinggulKanan;

// sirip dari 2 kurva b-spline (pinggir depan & belakang) yang ketemu di ujung
// titik kontrolnya [z, y, z, y, ...] jadi dilihat dari samping
// terus dikasih tebal di sumbu x
function buatSirip(kontrolDepan, kontrolBelakang, tebal, m) {
    var depan = generateBSpline(kontrolDepan, m, 2);
    var belakang = generateBSpline(kontrolBelakang, m, 2);
    var vertex = [];
    var faces = [];

    // sisi kiri (x = -tebal/2) terus sisi kanan (x = tebal/2)
    for (var x of [-tebal / 2, tebal / 2]) {
        for (var i = 0; i < m; i++) vertex.push(x, depan[i * 2 + 1], depan[i * 2]);
        for (var i = 0; i < m; i++) vertex.push(x, belakang[i * 2 + 1], belakang[i * 2]);
    }

    // index: sisi s, depan ke-i = s*2m + i, belakang ke-i = s*2m + m + i
    for (var s = 0; s < 2; s++) {
        var d = s * 2 * m, b = d + m;
        for (var i = 0; i < m - 1; i++) {
            faces.push(d + i, b + i, d + i + 1);
            faces.push(d + i + 1, b + i, b + i + 1);
        }
    }

    // dinding pinggir depan sama belakang, nyambungin sisi kiri ke kanan
    for (var off of [0, m]) {
        var kiri = off, kanan = 2 * m + off;
        for (var i = 0; i < m - 1; i++) {
            faces.push(kiri + i, kanan + i, kiri + i + 1);
            faces.push(kiri + i + 1, kanan + i, kanan + i + 1);
        }
    }

    return { vertex: vertex, faces: faces };
}

// 1 kaki lengkap: kaki putih + sepatu + batang sepatu + cincin + lidah sepatu
// titik (0,0,0) nya di pinggul
function buatKaki(GL, warnaCincin) {
    var hitam = [0.1, 0.1, 0.1];

    // kaki putih, panjang total = 2 * 0.06 + 0.38 = 0.5
    var k = buatKapsul(0.06, 0.06, 0.06, 0.38, 10, 16);
    var kaki = new Objek(GL, k.vertex, k.faces, [1, 1, 1]);
    LIBS.set_position(kaki.MOVEMATRIX, 0, -0.25, 0);

    // titik tengah bawah sepatu, pas di lantai, maju ke depan biar ujung sepatunya nongol
    // jadi kakinya ada di z = -0.06 kalau diliat dari sini
    var sepatu = new Objek(GL);
    LIBS.set_position(sepatu.MOVEMATRIX, 0, -0.4, 0.06);
    kaki.addChild(sepatu);

    // hiperboloid dibalik pake rotateX biar jadi kubah
    // terus dinaikin biar pinggir bawahnya pas di y = 0
    // tinggi sepatu = 0.32 * (1 / cos(vMax) - 1) = 0.14
    var vMax = 0.8;
    var h = buatHiperboloid2(0.146, 0.32, 0.233, vMax, 12, 24);
    var kubah = new Objek(GL, h.vertex, h.faces, hitam);
    LIBS.rotateX(kubah.MOVEMATRIX, Math.PI);
    LIBS.set_position(kubah.MOVEMATRIX, 0, 0.32 / Math.cos(vMax), 0);
    sepatu.addChild(kubah);

    // tutup bawah sepatu, ukurannya sama kayak pinggir bawah kubah
    var l = buatLingkaran(0.146 * Math.tan(vMax), 0.233 * Math.tan(vMax), 24);
    var sol = new Objek(GL, l.vertex, l.faces, hitam);
    LIBS.set_position(sol.MOVEMATRIX, 0, 0.002, 0);
    sepatu.addChild(sol);

    // batang sepatu yang bungkus pergelangan
    var t = buatTabung(0.1, 0.2, 24);
    var batang = new Objek(GL, t.vertex, t.faces, hitam);
    LIBS.set_position(batang.MOVEMATRIX, 0, 0.1, -0.06);
    sepatu.addChild(batang);

    // cincin warna di bawah batang sepatu
    var c = buatTorus(0.1, 0.1, 0.03, 0.03, 10, 24);
    var cincin = new Objek(GL, c.vertex, c.faces, warnaCincin);
    LIBS.set_position(cincin.MOVEMATRIX, 0, 0.14, -0.06);
    sepatu.addChild(cincin);

    // lidah sepatu di depan atas batang, naik ke atas terus agak maju
    var ld = buatSirip(
        [0.04, 0.2, 0.06, 0.3, 0.08, 0.36, 0.14, 0.42],
        [-0.02, 0.26, 0.0, 0.32, 0.06, 0.38, 0.14, 0.42],
        0.12, 20
    );
    var lidah = new Objek(GL, ld.vertex, ld.faces, hitam);
    sepatu.addChild(lidah);

    return kaki;
}

export function buatMagnetBomber(GL) {
    var warna = [0.2, 0.5, 1.0];

    // root di tanah (y = 0), kosong
    var root = new Objek(GL);

    // badan kapsul, tinggi total = 2 * ry + tinggi = 0.88
    var b = buatKapsul(0.26, 0.24, 0.22, 0.4, 20, 24);
    badan = new Objek(GL, b.vertex, b.faces, warna);
    LIBS.set_position(badan.MOVEMATRIX, 0, 1.0, 0);
    root.addChild(badan);

    // sabuk item, torus pipih biar kayak pita
    var s = buatTorus(0.25, 0.21, 0.025, 0.06, 12, 32);
    var sabuk = new Objek(GL, s.vertex, s.faces, [0.1, 0.1, 0.1]);
    LIBS.set_position(sabuk.MOVEMATRIX, 0, -0.1, 0);
    badan.addChild(sabuk);

    // gesper kuning, di depan sabuk
    var g = buatKotak(0.15, 0.1, 0.03);
    var gesper = new Objek(GL, g.vertex, g.faces, [1.0, 0.75, 0.1]);
    LIBS.set_position(gesper.MOVEMATRIX, 0, 0, 0.24);
    sabuk.addChild(gesper);

    // kotak item kecil di tengah gesper
    var gt = buatKotak(0.07, 0.04, 0.01);
    var gesperTengah = new Objek(GL, gt.vertex, gt.faces, [0.1, 0.1, 0.1]);
    LIBS.set_position(gesperTengah.MOVEMATRIX, 0, 0, 0.017);
    gesper.addChild(gesperTengah);

    // kepala sementara
    var k = buatEllipsoid(0.45, 0.4, 0.45, 20, 20);
    var kepala = new Objek(GL, k.vertex, k.faces, [1, 1, 1]);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.8, 0);
    badan.addChild(kepala);

    // pinggul = pivot buat kaki, ga ada bentuknya
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.17, -0.35, 0);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.17, -0.35, 0);
    badan.addChild(pinggulKiri);
    badan.addChild(pinggulKanan);

    // cincin kaki kiri biru, kanan merah
    pinggulKiri.addChild(buatKaki(GL, [0.2, 0.5, 1.0]));
    pinggulKanan.addChild(buatKaki(GL, [0.9, 0.15, 0.15]));

    return root;
}

// animasi nanti
export function animasiMagnetBomber(time) {
}
