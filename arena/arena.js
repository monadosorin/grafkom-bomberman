import { Objek } from "../shared/objek.js";
import { buatEllipsoid, buatKotak } from "../shared/bentuk.js";

// ukuran arena dalam petak, 1 petak = 1 unit
// x dari -7 sampai 7, z dari -5 sampai 5, pinggirnya tembok
var LEBAR = 15;
var DALAM = 11;

// pilar di pojok2, [x, z]
var PILAR = [
    [-5, -3], [-3, -3], [3, -3], [5, -3],
    [-5, -1], [5, -1],
    [-5, 1], [5, 1],
    [-5, 3], [-3, 3], [3, 3], [5, 3]
];

// gabungin banyak bentuk jadi 1 vertex & faces biar digambarnya sekali aja
// daftar = [{ bentuk: {vertex, faces}, x, y, z }, ...], tiap bentuk digeser ke (x, y, z)
function gabung(daftar) {
    var vertex = [];
    var faces = [];

    for (var item of daftar) {
        var awal = vertex.length / 3;
        var v = item.bentuk.vertex;
        for (var i = 0; i < v.length; i += 3) {
            vertex.push(v[i] + item.x, v[i + 1] + item.y, v[i + 2] + item.z);
        }
        for (var f of item.bentuk.faces) {
            faces.push(f + awal);
        }
    }

    return { vertex: vertex, faces: faces };
}

// petak lantai datar 1 x 1 di y = 0
function buatPetak() {
    var s = 0.5;
    return {
        vertex: [-s, 0, -s, s, 0, -s, s, 0, s, -s, 0, s],
        faces: [0, 2, 1, 0, 3, 2]
    };
}

export function buatArena(GL) {
    var arena = new Objek(GL);
    var setX = (LEBAR - 1) / 2;
    var setZ = (DALAM - 1) / 2;

    // lantai kotak2 2 warna ijo, selang seling kayak papan catur
    var petak = buatPetak();
    var terang = [], gelap = [];
    for (var x = -setX; x <= setX; x++) {
        for (var z = -setZ; z <= setZ; z++) {
            var item = { bentuk: petak, x: x, y: 0, z: z };
            if ((x + z) % 2 == 0) terang.push(item);
            else gelap.push(item);
        }
    }
    var lt = gabung(terang);
    var lg = gabung(gelap);
    arena.addChild(new Objek(GL, lt.vertex, lt.faces, [0.38, 0.66, 0.24]));
    arena.addChild(new Objek(GL, lg.vertex, lg.faces, [0.3, 0.55, 0.18]));

    // tembok luar: balok abu2 + lempeng di atasnya + 4 paku keling di pojok lempeng
    var balok = buatKotak(1, 0.7, 1);
    var lempeng = buatKotak(0.84, 0.08, 0.84);
    var paku = buatEllipsoid(0.05, 0.03, 0.05, 4, 8);
    var daftarBalok = [], daftarLempeng = [], daftarPaku = [];

    for (var x = -setX; x <= setX; x++) {
        for (var z = -setZ; z <= setZ; z++) {
            if (Math.abs(x) != setX && Math.abs(z) != setZ) continue;

            daftarBalok.push({ bentuk: balok, x: x, y: 0.35, z: z });
            daftarLempeng.push({ bentuk: lempeng, x: x, y: 0.74, z: z });
            for (var px of [-0.3, 0.3]) {
                for (var pz of [-0.3, 0.3]) {
                    daftarPaku.push({ bentuk: paku, x: x + px, y: 0.78, z: z + pz });
                }
            }
        }
    }

    var tb = gabung(daftarBalok);
    var tl = gabung(daftarLempeng);
    var tp = gabung(daftarPaku);
    arena.addChild(new Objek(GL, tb.vertex, tb.faces, [0.45, 0.46, 0.48]));
    arena.addChild(new Objek(GL, tl.vertex, tl.faces, [0.6, 0.61, 0.63]));
    arena.addChild(new Objek(GL, tp.vertex, tp.faces, [0.78, 0.79, 0.8]));

    // pilar di dalem: balok abu2 terang + kotak agak gelap di atasnya
    var pilar = buatKotak(0.82, 0.55, 0.82);
    var atasPilar = buatKotak(0.56, 0.04, 0.56);
    var daftarPilar = [], daftarAtas = [];
    for (var p of PILAR) {
        daftarPilar.push({ bentuk: pilar, x: p[0], y: 0.275, z: p[1] });
        daftarAtas.push({ bentuk: atasPilar, x: p[0], y: 0.56, z: p[1] });
    }

    var pp = gabung(daftarPilar);
    var pa = gabung(daftarAtas);
    arena.addChild(new Objek(GL, pp.vertex, pp.faces, [0.74, 0.74, 0.76]));
    arena.addChild(new Objek(GL, pa.vertex, pa.faces, [0.62, 0.62, 0.65]));

    return arena;
}
