import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";

var badan, pinggulKiri, pinggulKanan;

// ellipsoid, y ke atas
function buatEllipsoid(rx, ry, rz, stack, sector) {
    var vertex = [];
    var faces = [];

    for (var i = 0; i <= stack; i++) {
        var v = -Math.PI / 2 + Math.PI * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.cos(v) * Math.cos(u),
                ry * Math.sin(v),
                rz * Math.cos(v) * Math.sin(u)
            );
        }
    }

    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < sector; j++) {
            var p1 = i * (sector + 1) + j;
            var p2 = p1 + sector + 1;
            faces.push(p1, p2, p1 + 1);
            faces.push(p1 + 1, p2, p2 + 1);
        }
    }

    return { vertex: vertex, faces: faces };
}

// ellipsoid modifikasi: dibelah di tengah, atas digeser naik, bawah digeser turun
// stack harus genap
function buatKapsul(rx, ry, rz, tinggi, stack, sector) {
    var vertex = [];
    var faces = [];

    // ring v = 0 dibikin 2 kali (sekali turun, sekali naik) biar tengahnya lurus
    for (var i = 0; i <= stack + 1; i++) {
        var v, geser;
        if (i <= stack / 2) {
            v = -Math.PI / 2 + Math.PI * i / stack;
            geser = -tinggi / 2;
        } else {
            v = -Math.PI / 2 + Math.PI * (i - 1) / stack;
            geser = tinggi / 2;
        }

        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.cos(v) * Math.cos(u),
                ry * Math.sin(v) + geser,
                rz * Math.cos(v) * Math.sin(u)
            );
        }
    }

    for (var i = 0; i < stack + 1; i++) {
        for (var j = 0; j < sector; j++) {
            var p1 = i * (sector + 1) + j;
            var p2 = p1 + sector + 1;
            faces.push(p1, p2, p1 + 1);
            faces.push(p1 + 1, p2, p2 + 1);
        }
    }

    return { vertex: vertex, faces: faces };
}

// torus, Rx dan Rz = jari2 lingkaran besar
// rTebal = tebal tabungnya ke samping, rTinggi = tinggi tabungnya
// kalau rTinggi > rTebal tabungnya jadi pipih kayak pita
function buatTorus(Rx, Rz, rTebal, rTinggi, stack, sector) {
    var vertex = [];
    var faces = [];

    for (var i = 0; i <= stack; i++) {
        var v = -Math.PI + 2 * Math.PI * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                (Rx + rTebal * Math.cos(v)) * Math.cos(u),
                rTinggi * Math.sin(v),
                (Rz + rTebal * Math.cos(v)) * Math.sin(u)
            );
        }
    }

    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < sector; j++) {
            var p1 = i * (sector + 1) + j;
            var p2 = p1 + sector + 1;
            faces.push(p1, p2, p1 + 1);
            faces.push(p1 + 1, p2, p2 + 1);
        }
    }

    return { vertex: vertex, faces: faces };
}

// kotak, px py pz = panjang di sumbu x y z
// tiap sisi punya 4 vertex sendiri biar sudutnya tajam
function buatKotak(px, py, pz) {
    var x = px / 2, y = py / 2, z = pz / 2;
    var vertex = [
        -x, -y, z, x, -y, z, x, y, z, -x, y, z,         // depan
        -x, -y, -z, x, -y, -z, x, y, -z, -x, y, -z,     // belakang
        -x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z,     // kiri
        x, -y, -z, x, -y, z, x, y, z, x, y, -z,         // kanan
        -x, y, -z, x, y, -z, x, y, z, -x, y, z,         // atas
        -x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z      // bawah
    ];

    var faces = [];
    for (var i = 0; i < 6; i++) {
        var p = i * 4;
        faces.push(p, p + 1, p + 2, p, p + 2, p + 3);
    }

    return { vertex: vertex, faces: faces };
}

// tabung (cylinder) tanpa tutup, dari y = 0 sampai y = tinggi
function buatTabung(r, tinggi, sector) {
    var vertex = [];
    var faces = [];

    for (var y of [0, tinggi]) {
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(r * Math.cos(u), y, r * Math.sin(u));
        }
    }

    for (var j = 0; j < sector; j++) {
        var p1 = j;
        var p2 = j + sector + 1;
        faces.push(p1, p2, p1 + 1);
        faces.push(p1 + 1, p2, p2 + 1);
    }

    return { vertex: vertex, faces: faces };
}

// b-spline dari materi kelas, controlPoint = [x, y, x, y, ...]
function generateBSpline(controlPoint, m, degree) {
    var curves = [];
    var knotVector = [];
    var n = controlPoint.length / 2;

    for (var i = 0; i < n + degree + 1; i++) {
        if (i < degree + 1) knotVector.push(0);
        else if (i >= n) knotVector.push(n - degree);
        else knotVector.push(i - degree);
    }

    var basisFunc = function (i, j, t) {
        if (j == 0) {
            if (t >= knotVector[n] && i === n - 1) return 1;
            return (knotVector[i] <= t && t < knotVector[i + 1]) ? 1 : 0;
        }
        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];

        var term1 = 0, term2 = 0;
        if (den1 != 0 && !isNaN(den1)) {
            term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
        }
        if (den2 != 0 && !isNaN(den2)) {
            term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
        }
        return term1 + term2;
    };

    for (var t = 0; t < m; t++) {
        var x = 0, y = 0;
        var u = (t / (m - 1) * (knotVector[n] - knotVector[degree])) + knotVector[degree];
        for (var key = 0; key < n; key++) {
            var C = basisFunc(key, degree, u);
            x += (controlPoint[key * 2] * C);
            y += (controlPoint[key * 2 + 1] * C);
        }
        curves.push(x);
        curves.push(y);
    }
    return curves;
}

// hiperboloid 2 sisi, y ke atas, cuma dipake 1 sisi (sheet 1)
// v dari 0 sampai vMax, makin gede vMax makin lebar mangkoknya
function buatHiperboloid2(rx, ry, rz, vMax, stack, sector) {
    var vertex = [];
    var faces = [];

    for (var i = 0; i <= stack; i++) {
        var v = vMax * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.tan(v) * Math.cos(u),
                ry / Math.cos(v),
                rz * Math.tan(v) * Math.sin(u)
            );
        }
    }

    for (var i = 0; i < stack; i++) {
        for (var j = 0; j < sector; j++) {
            var p1 = i * (sector + 1) + j;
            var p2 = p1 + sector + 1;
            faces.push(p1, p2, p1 + 1);
            faces.push(p1 + 1, p2, p2 + 1);
        }
    }

    return { vertex: vertex, faces: faces };
}

// lingkaran (elips) datar di bidang xz, titik tengah + titik2 di pinggir
function buatLingkaran(rx, rz, sector) {
    var vertex = [0, 0, 0];
    var faces = [];

    for (var j = 0; j <= sector; j++) {
        var u = -Math.PI + 2 * Math.PI * j / sector;
        vertex.push(rx * Math.cos(u), 0, rz * Math.sin(u));
    }

    for (var j = 0; j < sector; j++) {
        faces.push(0, j + 1, j + 2);
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
