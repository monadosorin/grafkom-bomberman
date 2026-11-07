import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid, buatKapsul, buatTabung, buatHiperboloid1, buatHiperboloid2, buatParaboloid,
    buatTorus, buatLingkaran, buatKotak, generateBSpline, buatMeshKurva
} from "../shared/bentuk.js";

// disimpen di luar biar bisa diubah di animasi
var root, badan, pinggulKiri, pinggulKanan, bahuKiri, bahuKanan;
var antena, syalMerah, syalBiru;

// pita buat ekor syal, ngikutin kurva b-spline yang diliat dari atas
// kontrol = [x, z, x, z, ...], lebarnya ke arah y (atas bawah), makin ke ujung makin kecil
// turun = seberapa jauh ujungnya turun ke bawah
function buatPita(kontrol, lebarAwal, lebarAkhir, turun, m) {
    var kurva = generateBSpline(kontrol, m, 2);
    var vertex = [];
    var faces = [];

    for (var i = 0; i < m; i++) {
        var t = i / (m - 1);
        var lebar = lebarAwal + (lebarAkhir - lebarAwal) * t;
        var y = -turun * t;
        vertex.push(kurva[i * 2], y - lebar / 2, kurva[i * 2 + 1]);
        vertex.push(kurva[i * 2], y + lebar / 2, kurva[i * 2 + 1]);
    }

    for (var i = 0; i < m - 1; i++) {
        var p = i * 2;
        faces.push(p, p + 2, p + 1);
        faces.push(p + 1, p + 2, p + 3);
    }

    return { vertex: vertex, faces: faces };
}

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

// 1 lengan lengkap: lengan putih + sarung tinju
// titik (0,0,0) nya di bahu
function buatLengan(GL, warnaTangan) {
    // lengan putih, tabungnya dari y = 0 ke atas jadi diturunin 0.3 biar ngegantung
    var t = buatTabung(0.045, 0.3, 16);
    var lengan = new Objek(GL, t.vertex, t.faces, [1, 1, 1]);
    LIBS.set_position(lengan.MOVEMATRIX, 0, -0.3, 0);

    // titik tengah tangan, di ujung bawah lengan
    var tangan = new Objek(GL);
    LIBS.set_position(tangan.MOVEMATRIX, 0, -0.08, 0);
    lengan.addChild(tangan);

    // kepalan tangan, bola
    var b = buatEllipsoid(0.13, 0.13, 0.13, 16, 24);
    var kepalan = new Objek(GL, b.vertex, b.faces, warnaTangan);
    tangan.addChild(kepalan);

    // ujung sarung tinju, paraboloid yang kebuka ke atas ngebungkus pergelangan
    var p = buatParaboloid(0.09, 0.17, 0.09, 10, 24);
    var ujung = new Objek(GL, p.vertex, p.faces, warnaTangan);
    tangan.addChild(ujung);

    return lengan;
}

// kepala lengkap: kepala biru + muka item + mata + antena + magnet U
// titik (0,0,0) nya di tengah kepala
function buatKepala(GL) {
    var biruMuda = [0.3, 0.62, 1.0];
    var emas = [0.95, 0.68, 0.15];

    var k = buatEllipsoid(0.38, 0.34, 0.36, 24, 32);
    var kepala = new Objek(GL, k.vertex, k.faces, biruMuda);

    // muka item (visor), paraboloid yang diputer biar ujungnya ngadep depan
    // rotateX(-90 derajat): tinggi paraboloid (y) jadi ke belakang (-z), rz jadi tinggi muka
    var p = buatParaboloid(0.3, 0.08, 0.28, 12, 32);
    var muka = new Objek(GL, p.vertex, p.faces, [0.08, 0.08, 0.1]);
    LIBS.rotateX(muka.MOVEMATRIX, -Math.PI / 2);
    LIBS.set_position(muka.MOVEMATRIX, 0, -0.02, 0.375);
    kepala.addChild(muka);

    // mata kuning, ellipsoid gepeng, dimiringin biar keliatan galak
    // rotateY dikit biar ngikutin lengkungan muka
    var m = buatEllipsoid(0.075, 0.045, 0.02, 12, 16);
    var mataKiri = new Objek(GL, m.vertex, m.faces, [1.0, 0.85, 0.1]);
    var mataKanan = new Objek(GL, m.vertex, m.faces, [1.0, 0.85, 0.1]);
    LIBS.rotateZ(mataKiri.MOVEMATRIX, -0.4);
    LIBS.rotateY(mataKiri.MOVEMATRIX, -0.25);
    LIBS.set_position(mataKiri.MOVEMATRIX, -0.1, 0, 0.37);
    LIBS.rotateZ(mataKanan.MOVEMATRIX, 0.4);
    LIBS.rotateY(mataKanan.MOVEMATRIX, 0.25);
    LIBS.set_position(mataKanan.MOVEMATRIX, 0.1, 0, 0.37);
    kepala.addChild(mataKiri);
    kepala.addChild(mataKanan);

    // antena: pivot di atas kepala, isinya batang (cylinder) + bola
    antena = new Objek(GL);
    LIBS.rotateZ(antena.MOVEMATRIX, 0.4);
    LIBS.set_position(antena.MOVEMATRIX, -0.1, 0.3, -0.05);
    kepala.addChild(antena);

    var t = buatTabung(0.022, 0.25, 12);
    var batangAntena = new Objek(GL, t.vertex, t.faces, [0.85, 0.85, 0.9]);
    antena.addChild(batangAntena);

    var bl = buatEllipsoid(0.1, 0.1, 0.1, 16, 24);
    var bolaAntena = new Objek(GL, bl.vertex, bl.faces, biruMuda);
    LIBS.set_position(bolaAntena.MOVEMATRIX, 0, 0.32, 0);
    antena.addChild(bolaAntena);

    // magnet U di jidat, agak miring ke belakang ngikutin kepala
    var magnet = new Objek(GL);
    LIBS.rotateX(magnet.MOVEMATRIX, -0.35);
    LIBS.set_position(magnet.MOVEMATRIX, 0, 0.35, 0.2);
    kepala.addChild(magnet);

    // badan magnetnya: pipa yang ngikutin kurva b-spline bentuk U
    var kurvaU = generateBSpline([
        -0.11, 0.2,
        -0.11, 0.05,
        -0.11, -0.08,
        0.11, -0.08,
        0.11, 0.05,
        0.11, 0.2
    ], 30, 2);
    var pu = buatMeshKurva(kurvaU, 0.035, 0.035, null, 16);
    var badanMagnet = new Objek(GL, pu.vertex, pu.faces, emas);
    magnet.addChild(badanMagnet);

    // ujung magnet, hiperboloid 1 sisi (kayak jam pasir) di tiap ujung U
    var hp = buatHiperboloid1(0.03, 0.03, 0.03, 0.7, 8, 16);
    var ujungKiri = new Objek(GL, hp.vertex, hp.faces, [0.85, 0.85, 0.9]);
    var ujungKanan = new Objek(GL, hp.vertex, hp.faces, [0.85, 0.85, 0.9]);
    LIBS.set_position(ujungKiri.MOVEMATRIX, -0.11, 0.22, 0);
    LIBS.set_position(ujungKanan.MOVEMATRIX, 0.11, 0.22, 0);
    magnet.addChild(ujungKiri);
    magnet.addChild(ujungKanan);

    return kepala;
}

export function buatMagnetBomber(GL) {
    var warna = [0.2, 0.5, 1.0];

    // root di tanah (y = 0), kosong
    root = new Objek(GL);

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

    // leher, tabung pendek
    var lh = buatTabung(0.1, 0.14, 16);
    var leher = new Objek(GL, lh.vertex, lh.faces, [1, 1, 1]);
    LIBS.set_position(leher.MOVEMATRIX, 0, 0.36, 0);
    badan.addChild(leher);

    // syal putih yang ngelilingin leher (toroid / kerah leher)
    var ks = buatTorus(0.14, 0.13, 0.06, 0.05, 12, 32);
    var kerah = new Objek(GL, ks.vertex, ks.faces, [1, 1, 1]);
    LIBS.set_position(kerah.MOVEMATRIX, 0, 0.44, 0);
    badan.addChild(kerah);

    // ekor syal merah sama biru di belakang leher
    // posisinya diatur di animasi biar bisa berkibar
    syalMerah = new Objek(GL);
    syalBiru = new Objek(GL);
    badan.addChild(syalMerah);
    badan.addChild(syalBiru);

    var pm = buatPita([0, 0, 0.1, -0.15, 0.02, -0.35, 0.14, -0.55, 0.08, -0.75], 0.14, 0.04, 0.12, 30);
    syalMerah.addChild(new Objek(GL, pm.vertex, pm.faces, [0.9, 0.2, 0.2]));

    var pb = buatPita([0, 0, -0.1, -0.15, -0.02, -0.35, -0.14, -0.55, -0.08, -0.7], 0.12, 0.03, 0.2, 30);
    syalBiru.addChild(new Objek(GL, pb.vertex, pb.faces, [0.25, 0.45, 0.95]));

    var kepala = buatKepala(GL);
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

    // bahu = pivot buat lengan, di samping atas badan
    // dirotate dikit biar lengannya agak ngebuka keluar
    bahuKiri = new Objek(GL);
    bahuKanan = new Objek(GL);
    LIBS.rotateZ(bahuKiri.MOVEMATRIX, -0.35);
    LIBS.rotateZ(bahuKanan.MOVEMATRIX, 0.35);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.24, 0.15, 0);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.24, 0.15, 0);
    badan.addChild(bahuKiri);
    badan.addChild(bahuKanan);

    // tangan kiri sarung tinju merah, kanan biru
    bahuKiri.addChild(buatLengan(GL, [0.9, 0.15, 0.15]));
    bahuKanan.addChild(buatLengan(GL, [0.15, 0.3, 0.85]));

    return root;
}

export function animasiMagnetBomber(time) {
    var t = time / 1000;

    // jalan muter lingkaran jari2 1, ngadep ke arah jalannya
    var sudut = t * 0.5;
    LIBS.set_I4(root.MOVEMATRIX);
    LIBS.rotateY(root.MOVEMATRIX, sudut + Math.PI / 2);
    LIBS.set_position(root.MOVEMATRIX, Math.sin(sudut), 0, Math.cos(sudut));

    // langkah kaki, kaki kiri kanan gantian
    var langkah = t * 2 * Math.PI * 0.8;
    var ayun = Math.sin(langkah) * 0.45;

    LIBS.set_I4(pinggulKiri.MOVEMATRIX);
    LIBS.rotateX(pinggulKiri.MOVEMATRIX, ayun);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.17, -0.35, 0);

    LIBS.set_I4(pinggulKanan.MOVEMATRIX);
    LIBS.rotateX(pinggulKanan.MOVEMATRIX, -ayun);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.17, -0.35, 0);

    // tangan ayun kebalikan dari kaki di sisi yang sama
    LIBS.set_I4(bahuKiri.MOVEMATRIX);
    LIBS.rotateZ(bahuKiri.MOVEMATRIX, -0.35);
    LIBS.rotateX(bahuKiri.MOVEMATRIX, -ayun * 0.8);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.24, 0.15, 0);

    LIBS.set_I4(bahuKanan.MOVEMATRIX);
    LIBS.rotateZ(bahuKanan.MOVEMATRIX, 0.35);
    LIBS.rotateX(bahuKanan.MOVEMATRIX, ayun * 0.8);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.24, 0.15, 0);

    // badan naik turun dikit tiap langkah
    LIBS.set_I4(badan.MOVEMATRIX);
    LIBS.set_position(badan.MOVEMATRIX, 0, 1.0 + Math.abs(Math.sin(langkah)) * 0.04, 0);

    // antena goyang
    LIBS.set_I4(antena.MOVEMATRIX);
    LIBS.rotateZ(antena.MOVEMATRIX, 0.4 + Math.sin(t * 3) * 0.15);
    LIBS.set_position(antena.MOVEMATRIX, -0.1, 0.3, -0.05);

    // ekor syal berkibar
    LIBS.set_I4(syalMerah.MOVEMATRIX);
    LIBS.rotateX(syalMerah.MOVEMATRIX, Math.sin(t * 5) * 0.08);
    LIBS.rotateY(syalMerah.MOVEMATRIX, 0.35 + Math.sin(t * 4) * 0.15);
    LIBS.set_position(syalMerah.MOVEMATRIX, 0.05, 0.44, -0.15);

    LIBS.set_I4(syalBiru.MOVEMATRIX);
    LIBS.rotateX(syalBiru.MOVEMATRIX, Math.sin(t * 5 + 1) * 0.08);
    LIBS.rotateY(syalBiru.MOVEMATRIX, -0.35 + Math.sin(t * 4 + 1) * 0.15);
    LIBS.set_position(syalBiru.MOVEMATRIX, -0.05, 0.4, -0.15);
}
