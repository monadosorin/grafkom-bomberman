import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid, buatKapsul, buatTabung, buatHiperboloid1, buatHiperboloid2, buatParaboloid,
    buatTorus, buatLingkaran, buatKotak, generateBSpline
} from "../shared/bentuk.js";

// disimpen di luar biar bisa diubah di animasi
var badan, pinggulKiri, pinggulKanan, bahuKiri, bahuKanan;
var antena, syalMerah, syalPutih, syalBiru;

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

// warna
var BIRU = [0.24, 0.58, 0.95];
var BIRU_TUA = [0.15, 0.32, 0.85];
var MERAH = [0.9, 0.15, 0.15];
var PUTIH = [1, 1, 1];
var HITAM = [0.1, 0.1, 0.1];
var KUNING = [1.0, 0.85, 0.1];
var EMAS = [0.96, 0.66, 0.12];

// balok yang ngikutin kurva 2D di bidang xy (misal hasil generateBSpline)
// penampangnya persegi panjang, lebar = ke arah bidang kurva, tebal = ke arah z
// tiap sisi punya vertex sendiri (kayak buatKotak) biar pinggirnya tajam
function buatBalokKurva(kurva, lebar, tebal) {
    var m = kurva.length / 2;
    var vertex = [];
    var faces = [];

    // arah tegak lurus kurva di tiap titik
    var nx = [], ny = [];
    for (var i = 0; i < m; i++) {
        var a = Math.max(i - 1, 0), b = Math.min(i + 1, m - 1);
        var tx = kurva[b * 2] - kurva[a * 2];
        var ty = kurva[b * 2 + 1] - kurva[a * 2 + 1];
        var panjang = Math.sqrt(tx * tx + ty * ty) || 1;
        nx.push(-ty / panjang);
        ny.push(tx / panjang);
    }

    // 4 sudut penampang, [geser ke arah normal, geser ke z]
    var w = lebar / 2, d = tebal / 2;
    var sudut = [[w, d], [-w, d], [-w, -d], [w, -d]];

    function titik(i, s) {
        return [
            kurva[i * 2] + s[0] * nx[i],
            kurva[i * 2 + 1] + s[0] * ny[i],
            s[1]
        ];
    }

    // 4 sisi panjang, tiap sisi = pita dari sudut s ke sudut s+1
    for (var s = 0; s < 4; s++) {
        var awal = vertex.length / 3;
        for (var i = 0; i < m; i++) {
            vertex.push(...titik(i, sudut[s]));
            vertex.push(...titik(i, sudut[(s + 1) % 4]));
        }
        for (var i = 0; i < m - 1; i++) {
            var k = awal + i * 2;
            faces.push(k, k + 2, k + 1);
            faces.push(k + 1, k + 2, k + 3);
        }
    }

    // tutup ujung awal sama ujung akhir
    for (var i of [0, m - 1]) {
        var awal = vertex.length / 3;
        for (var s = 0; s < 4; s++) vertex.push(...titik(i, sudut[s]));
        faces.push(awal, awal + 1, awal + 2);
        faces.push(awal, awal + 2, awal + 3);
    }

    return { vertex: vertex, faces: faces };
}

// 1 kaki lengkap: kaki putih + sepatu + batang sepatu + cincin + lidah sepatu
// titik (0,0,0) nya di pinggul
function buatKaki(GL, warnaCincin) {
    // kaki putih, panjang total = 2 * 0.055 + 0.3 = 0.41
    var k = buatKapsul(0.055, 0.055, 0.055, 0.3, 10, 16);
    var kaki = new Objek(GL, k.vertex, k.faces, PUTIH);
    LIBS.set_position(kaki.MOVEMATRIX, 0, -0.2, 0);

    // titik tengah bawah sepatu, pas di lantai, maju ke depan biar ujung sepatunya nongol
    // jadi kakinya ada di z = -0.06 kalau diliat dari sini
    var sepatu = new Objek(GL);
    LIBS.set_position(sepatu.MOVEMATRIX, 0, -0.3, 0.06);
    kaki.addChild(sepatu);

    // hiperboloid dibalik pake rotateX biar jadi kubah
    // terus dinaikin biar pinggir bawahnya pas di y = 0
    // tinggi sepatu = 0.37 * (1 / cos(vMax) - 1) = 0.16
    var vMax = 0.8;
    var h = buatHiperboloid2(0.15, 0.37, 0.25, vMax, 12, 24);
    var kubah = new Objek(GL, h.vertex, h.faces, HITAM);
    LIBS.rotateX(kubah.MOVEMATRIX, Math.PI);
    LIBS.set_position(kubah.MOVEMATRIX, 0, 0.37 / Math.cos(vMax), 0);
    sepatu.addChild(kubah);

    // tutup bawah sepatu, ukurannya sama kayak pinggir bawah kubah
    var l = buatLingkaran(0.15 * Math.tan(vMax), 0.25 * Math.tan(vMax), 24);
    var sol = new Objek(GL, l.vertex, l.faces, HITAM);
    LIBS.set_position(sol.MOVEMATRIX, 0, 0.002, 0);
    sepatu.addChild(sol);

    // batang sepatu yang bungkus pergelangan
    var t = buatTabung(0.11, 0.2, 24);
    var batang = new Objek(GL, t.vertex, t.faces, HITAM);
    LIBS.set_position(batang.MOVEMATRIX, 0, 0.1, -0.06);
    sepatu.addChild(batang);

    // cincin warna di bawah batang sepatu
    var c = buatTorus(0.11, 0.11, 0.035, 0.035, 10, 24);
    var cincin = new Objek(GL, c.vertex, c.faces, warnaCincin);
    LIBS.set_position(cincin.MOVEMATRIX, 0, 0.155, -0.06);
    sepatu.addChild(cincin);

    // lidah sepatu di depan atas batang, naik ke atas terus agak maju
    var ld = buatSirip(
        [0.05, 0.2, 0.07, 0.3, 0.09, 0.37, 0.16, 0.43],
        [-0.01, 0.26, 0.01, 0.33, 0.07, 0.39, 0.16, 0.43],
        0.14, 20
    );
    var lidah = new Objek(GL, ld.vertex, ld.faces, HITAM);
    sepatu.addChild(lidah);

    return kaki;
}

// 1 lengan lengkap: lengan putih + sarung tinju
// titik (0,0,0) nya di bahu
function buatLengan(GL, warnaTangan) {
    // lengan putih, tabungnya dari y = 0 ke atas jadi diturunin 0.2 biar ngegantung
    var t = buatTabung(0.045, 0.2, 16);
    var lengan = new Objek(GL, t.vertex, t.faces, PUTIH);
    LIBS.set_position(lengan.MOVEMATRIX, 0, -0.2, 0);

    // titik tengah tangan, di ujung bawah lengan
    var tangan = new Objek(GL);
    LIBS.set_position(tangan.MOVEMATRIX, 0, -0.1, 0);
    lengan.addChild(tangan);

    // kepalan sarung tinju, bola gede
    var b = buatEllipsoid(0.17, 0.16, 0.17, 16, 24);
    var kepalan = new Objek(GL, b.vertex, b.faces, warnaTangan);
    tangan.addChild(kepalan);

    // ujung sarung tinju, paraboloid yang kebuka ke atas ngebungkus pergelangan
    var p = buatParaboloid(0.12, 0.2, 0.12, 10, 24);
    var ujung = new Objek(GL, p.vertex, p.faces, warnaTangan);
    tangan.addChild(ujung);

    return lengan;
}

// kepala lengkap: kepala biru + muka item + mata + antena + magnet U
// titik (0,0,0) nya di tengah kepala
function buatKepala(GL) {
    var k = buatEllipsoid(0.44, 0.4, 0.42, 24, 36);
    var kepala = new Objek(GL, k.vertex, k.faces, BIRU);

    // muka item (kaca visor), paraboloid yang diputer biar ujungnya ngadep depan
    // rotateX(-90 derajat): tinggi paraboloid (y) jadi ke belakang (-z), rz jadi tinggi muka
    // lengkungnya dibikin hampir sama kayak kepala biar nempel
    var p = buatParaboloid(0.34, 0.125, 0.3, 12, 36);
    var muka = new Objek(GL, p.vertex, p.faces, [0.06, 0.06, 0.08]);
    LIBS.rotateX(muka.MOVEMATRIX, -Math.PI / 2);
    LIBS.set_position(muka.MOVEMATRIX, 0, -0.02, 0.436);
    kepala.addChild(muka);

    // pinggiran helm biru di sekeliling muka, torus yang diberdiriin pake rotateX
    // z nya = pinggir paraboloid = 0.436 - 0.125
    var pg = buatTorus(0.34, 0.3, 0.035, 0.035, 10, 48);
    var pinggiran = new Objek(GL, pg.vertex, pg.faces, BIRU);
    LIBS.rotateX(pinggiran.MOVEMATRIX, Math.PI / 2);
    LIBS.set_position(pinggiran.MOVEMATRIX, 0, -0.02, 0.311);
    kepala.addChild(pinggiran);

    // mata kuning gede, ellipsoid gepeng dimiringin
    // terus ditutup kelopak item di atasnya biar keliatan galak
    var m = buatEllipsoid(0.11, 0.075, 0.03, 12, 20);
    var kl = buatEllipsoid(0.13, 0.05, 0.035, 12, 20);
    for (var sisi of [-1, 1]) {
        var mata = new Objek(GL, m.vertex, m.faces, KUNING);
        LIBS.rotateZ(mata.MOVEMATRIX, 0.35 * sisi);
        LIBS.rotateY(mata.MOVEMATRIX, 0.3 * sisi);
        LIBS.set_position(mata.MOVEMATRIX, 0.135 * sisi, -0.01, 0.418);
        kepala.addChild(mata);

        var kelopak = new Objek(GL, kl.vertex, kl.faces, [0.06, 0.06, 0.08]);
        LIBS.rotateZ(kelopak.MOVEMATRIX, 0.6 * sisi);
        LIBS.rotateY(kelopak.MOVEMATRIX, 0.3 * sisi);
        LIBS.set_position(kelopak.MOVEMATRIX, 0.115 * sisi, 0.055, 0.426);
        kepala.addChild(kelopak);
    }

    // antena: pivot di atas kepala agak belakang, isinya batang (cylinder) + bola gede
    antena = new Objek(GL);
    kepala.addChild(antena);

    var t = buatTabung(0.025, 0.18, 12);
    var batangAntena = new Objek(GL, t.vertex, t.faces, PUTIH);
    antena.addChild(batangAntena);

    var bl = buatEllipsoid(0.13, 0.13, 0.13, 16, 24);
    var bolaAntena = new Objek(GL, bl.vertex, bl.faces, BIRU);
    LIBS.set_position(bolaAntena.MOVEMATRIX, 0, 0.27, 0);
    antena.addChild(bolaAntena);

    // magnet U di jidat, dimiringin ke belakang ngikutin jidat
    // bawahnya nutupin atas muka, kakinya nongol lewat atas kepala
    var magnet = new Objek(GL);
    LIBS.rotateX(magnet.MOVEMATRIX, -0.75);
    LIBS.set_position(magnet.MOVEMATRIX, 0, 0.29, 0.32);
    kepala.addChild(magnet);

    // badan magnetnya: balok yang ngikutin kurva b-spline bentuk U
    // penampangnya kotak (lebar 0.07, tebal 0.045) biar tajam kayak di game
    var kurvaU = generateBSpline([
        -0.13, 0.21,
        -0.13, 0.0,
        -0.13, -0.2,
        0.13, -0.2,
        0.13, 0.0,
        0.13, 0.21
    ], 36, 2);
    var pu = buatBalokKurva(kurvaU, 0.07, 0.045);
    var badanMagnet = new Objek(GL, pu.vertex, pu.faces, EMAS);
    magnet.addChild(badanMagnet);

    // gelang di deket ujung magnet, hiperboloid 1 sisi (kayak jam pasir) yang ngelilingin kaki U
    // pinggangnya = setengah penampang balok x akar 2, biar sudut baloknya ga nembus
    var hp = buatHiperboloid1(0.05, 0.035, 0.032, 0.6, 8, 20);
    for (var sisi of [-1, 1]) {
        var gelang = new Objek(GL, hp.vertex, hp.faces, [0.8, 0.5, 0.08]);
        LIBS.set_position(gelang.MOVEMATRIX, 0.13 * sisi, 0.16, 0);
        magnet.addChild(gelang);
    }

    return kepala;
}

export function buatMagnetBomber(GL) {
    // root di tanah (y = 0), kosong
    // digedein 1.15 biar tingginya sama kayak bomber lain, kakinya tetep di lantai
    var root = new Objek(GL);
    LIBS.scale(root.MOVEMATRIX, 1.15, 1.15, 1.15);

    // badan kapsul pendek, tinggi total = 2 * 0.19 + 0.16 = 0.54
    // posisi y nya diatur di animasi (naik turun)
    var b = buatKapsul(0.22, 0.19, 0.2, 0.16, 20, 24);
    badan = new Objek(GL, b.vertex, b.faces, BIRU);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.7, 0);
    root.addChild(badan);

    // sabuk item, torus pipih biar kayak pita
    var s = buatTorus(0.215, 0.195, 0.02, 0.05, 12, 32);
    var sabuk = new Objek(GL, s.vertex, s.faces, HITAM);
    LIBS.set_position(sabuk.MOVEMATRIX, 0, -0.02, 0);
    badan.addChild(sabuk);

    // gesper kuning, di depan sabuk
    var g = buatKotak(0.13, 0.085, 0.03);
    var gesper = new Objek(GL, g.vertex, g.faces, [1.0, 0.75, 0.1]);
    LIBS.set_position(gesper.MOVEMATRIX, 0, 0, 0.22);
    sabuk.addChild(gesper);

    // kotak item kecil di tengah gesper
    var gt = buatKotak(0.06, 0.035, 0.01);
    var gesperTengah = new Objek(GL, gt.vertex, gt.faces, HITAM);
    LIBS.set_position(gesperTengah.MOVEMATRIX, 0, 0, 0.017);
    gesper.addChild(gesperTengah);

    // leher, tabung pendek
    var lh = buatTabung(0.1, 0.1, 16);
    var leher = new Objek(GL, lh.vertex, lh.faces, PUTIH);
    LIBS.set_position(leher.MOVEMATRIX, 0, 0.22, 0);
    badan.addChild(leher);

    // syal putih yang ngelilingin leher (toroid / kerah leher)
    var ks = buatTorus(0.15, 0.14, 0.06, 0.05, 12, 32);
    var kerah = new Objek(GL, ks.vertex, ks.faces, PUTIH);
    LIBS.set_position(kerah.MOVEMATRIX, 0, 0.28, 0);
    badan.addChild(kerah);

    // ekor syal merah, putih, biru di belakang leher, kebawa angin ke samping
    // posisinya diatur di animasi biar bisa berkibar
    syalMerah = new Objek(GL);
    syalPutih = new Objek(GL);
    syalBiru = new Objek(GL);
    badan.addChild(syalMerah);
    badan.addChild(syalPutih);
    badan.addChild(syalBiru);

    var pm = buatPita([0, 0, -0.1, -0.2, 0.05, -0.45, -0.1, -0.7, 0, -0.95], 0.26, 0.06, 0.12, 36);
    syalMerah.addChild(new Objek(GL, pm.vertex, pm.faces, MERAH));

    var pp = buatPita([0, 0, 0.08, -0.2, -0.06, -0.45, 0.08, -0.7, -0.02, -0.9], 0.24, 0.05, 0.2, 36);
    syalPutih.addChild(new Objek(GL, pp.vertex, pp.faces, PUTIH));

    var pb = buatPita([0, 0, -0.08, -0.2, 0.06, -0.42, -0.08, -0.65, 0.02, -0.85], 0.22, 0.05, 0.3, 36);
    syalBiru.addChild(new Objek(GL, pb.vertex, pb.faces, [0.3, 0.45, 0.95]));

    var kepala = buatKepala(GL);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.63, 0);
    badan.addChild(kepala);

    // pinggul = pivot buat kaki, ga ada bentuknya
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    badan.addChild(pinggulKiri);
    badan.addChild(pinggulKanan);

    // cincin kaki kiri biru, kanan merah
    pinggulKiri.addChild(buatKaki(GL, BIRU_TUA));
    pinggulKanan.addChild(buatKaki(GL, MERAH));

    // bahu = pivot buat lengan, di samping atas badan
    bahuKiri = new Objek(GL);
    bahuKanan = new Objek(GL);
    badan.addChild(bahuKiri);
    badan.addChild(bahuKanan);

    // tangan kiri sarung tinju merah, kanan biru tua
    bahuKiri.addChild(buatLengan(GL, MERAH));
    bahuKanan.addChild(buatLengan(GL, BIRU_TUA));

    // pose awal, langsung pake animasi di waktu 0
    animasiMagnetBomber(0);

    return root;
}

export function animasiMagnetBomber(time) {
    var t = time / 1000;

    // jalan di tempat, kaki kiri kanan gantian
    var langkah = t * 2 * Math.PI * 0.9;
    var ayun = Math.sin(langkah) * 0.4;

    LIBS.set_I4(pinggulKiri.MOVEMATRIX);
    LIBS.rotateX(pinggulKiri.MOVEMATRIX, ayun);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.16, -0.2, 0);

    LIBS.set_I4(pinggulKanan.MOVEMATRIX);
    LIBS.rotateX(pinggulKanan.MOVEMATRIX, -ayun);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.16, -0.2, 0);

    // tangan ayun kebalikan dari kaki di sisi yang sama
    // rotateZ = lengan agak ngebuka keluar, rotateX = ayunannya
    LIBS.set_I4(bahuKiri.MOVEMATRIX);
    LIBS.rotateZ(bahuKiri.MOVEMATRIX, -0.5);
    LIBS.rotateX(bahuKiri.MOVEMATRIX, -ayun * 0.9);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.2, 0.06, 0);

    LIBS.set_I4(bahuKanan.MOVEMATRIX);
    LIBS.rotateZ(bahuKanan.MOVEMATRIX, 0.5);
    LIBS.rotateX(bahuKanan.MOVEMATRIX, ayun * 0.9);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.2, 0.06, 0);

    // badan naik turun dikit tiap langkah
    LIBS.set_I4(badan.MOVEMATRIX);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.7 + Math.abs(Math.sin(langkah)) * 0.035, 0);

    // antena goyang
    LIBS.set_I4(antena.MOVEMATRIX);
    LIBS.rotateZ(antena.MOVEMATRIX, 0.3 + Math.sin(t * 3) * 0.12);
    LIBS.set_position(antena.MOVEMATRIX, -0.16, 0.33, -0.12);

    // ekor syal berkibar, makin bawah makin ke samping
    var syal = [[syalMerah, 0.5, 0.27], [syalPutih, 0.72, 0.24], [syalBiru, 0.95, 0.21]];
    for (var i = 0; i < syal.length; i++) {
        var o = syal[i][0];
        LIBS.set_I4(o.MOVEMATRIX);
        LIBS.rotateX(o.MOVEMATRIX, Math.sin(t * 5 + i) * 0.08);
        LIBS.rotateY(o.MOVEMATRIX, syal[i][1] + Math.sin(t * 4 + i) * 0.15);
        LIBS.set_position(o.MOVEMATRIX, 0, syal[i][2], -0.16);
    }
}
