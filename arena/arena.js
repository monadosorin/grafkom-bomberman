import { Objek } from "../shared/objek.js";
import { buatEllipsoid, buatKotak } from "../shared/bentuk.js";

// ukuran arena dalam petak, harus ganjil biar ada petak tengah
var LEBAR = 15;
var DALAM = 11;

// 1 petak = 2 unit, jadi arenanya 30 x 22 unit
var PETAK = 2;

// tinggi tembok luar sama pilar (unit)
var TINGGI_TEMBOK = 1.6;
var TINGGI_PILAR = 1.1;

// pola pilar di 1 pojok, [jarak dari tembok samping, jarak dari tembok depan/belakang] dalam petak
// pola ini dicopy ke 4 pojok, jadi tengah arena tetep kosong
var POLA_PILAR = [
    [2, 2], [4, 2],
    [2, 4]
];

// ===== koordinat petak =====
// petak (x, y): x = kiri (-) ke kanan (+), y = depan (-) ke belakang (+), (0, 0) = petak tengah
// depan = deket kamera awal. tembok ada di x = -7 / 7 sama y = -5 / 5
// jadi petak yang bisa diinjek: x dari -6 sampai 6, y dari -4 sampai 4
var BATAS_X = (LEBAR - 1) / 2;
var BATAS_Y = (DALAM - 1) / 2;

// daftar petak pilar [x, y], pola di atas dicopy ke 4 pojok
var PILAR = [];
for (var p of POLA_PILAR) {
    for (var sx of [-1, 1]) {
        for (var sy of [-1, 1]) {
            PILAR.push([sx * (BATAS_X - p[0]), sy * (BATAS_Y - p[1])]);
        }
    }
}

// posisi dunia (x, z) dari petak (x, y)
export function posisiPetak(x, y) {
    return { x: x * PETAK, z: -y * PETAK };
}

// true kalau petak itu tembok / pilar / di luar arena
export function petakDiblok(x, y) {
    if (Math.abs(x) >= BATAS_X || Math.abs(y) >= BATAS_Y) return true;
    for (var p of PILAR) {
        if (p[0] == x && p[1] == y) return true;
    }
    return false;
}

// label koordinat tiap petak buat engine (muncul pas pencet G), pilar warnanya merah
export function labelPetak() {
    var label = [];
    for (var x = -BATAS_X + 1; x <= BATAS_X - 1; x++) {
        for (var y = -BATAS_Y + 1; y <= BATAS_Y - 1; y++) {
            var pos = posisiPetak(x, y);
            var diblok = petakDiblok(x, y);
            label.push({
                teks: x + "," + y,
                x: pos.x,
                y: diblok ? TINGGI_PILAR + 0.2 : 0.05,
                z: pos.z,
                warna: diblok ? "#ff6b6b" : "white"
            });
        }
    }
    return label;
}

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

// petak lantai datar ukuran s x s di y = 0
function buatPetak(s) {
    var h = s / 2;
    return {
        vertex: [-h, 0, -h, h, 0, -h, h, 0, h, -h, 0, h],
        faces: [0, 2, 1, 0, 3, 2]
    };
}

export function buatArena(GL) {
    var arena = new Objek(GL);

    // i, j = nomor petak dari tengah, posisi aslinya = nomor x PETAK
    var setI = (LEBAR - 1) / 2;
    var setJ = (DALAM - 1) / 2;

    // lantai kotak2 2 warna ijo, selang seling kayak papan catur
    var petak = buatPetak(PETAK);
    var terang = [], gelap = [];
    for (var i = -setI; i <= setI; i++) {
        for (var j = -setJ; j <= setJ; j++) {
            var item = { bentuk: petak, x: i * PETAK, y: 0, z: j * PETAK };
            if ((i + j) % 2 == 0) terang.push(item);
            else gelap.push(item);
        }
    }
    var lt = gabung(terang);
    var lg = gabung(gelap);
    arena.addChild(new Objek(GL, lt.vertex, lt.faces, [0.38, 0.66, 0.24]));
    arena.addChild(new Objek(GL, lg.vertex, lg.faces, [0.3, 0.55, 0.18]));

    // tembok luar: balok abu2 + lempeng di atasnya + 4 paku keling di pojok lempeng
    var balok = buatKotak(PETAK, TINGGI_TEMBOK, PETAK);
    var lempeng = buatKotak(PETAK * 0.84, 0.12, PETAK * 0.84);
    var paku = buatEllipsoid(0.09, 0.05, 0.09, 4, 8);
    var daftarBalok = [], daftarLempeng = [], daftarPaku = [];

    for (var i = -setI; i <= setI; i++) {
        for (var j = -setJ; j <= setJ; j++) {
            if (Math.abs(i) != setI && Math.abs(j) != setJ) continue;

            var x = i * PETAK, z = j * PETAK;
            daftarBalok.push({ bentuk: balok, x: x, y: TINGGI_TEMBOK / 2, z: z });
            daftarLempeng.push({ bentuk: lempeng, x: x, y: TINGGI_TEMBOK + 0.06, z: z });
            for (var px of [-0.3, 0.3]) {
                for (var pz of [-0.3, 0.3]) {
                    daftarPaku.push({ bentuk: paku, x: x + px * PETAK, y: TINGGI_TEMBOK + 0.13, z: z + pz * PETAK });
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
    var pilar = buatKotak(PETAK * 0.82, TINGGI_PILAR, PETAK * 0.82);
    var atasPilar = buatKotak(PETAK * 0.56, 0.06, PETAK * 0.56);
    var daftarPilar = [], daftarAtas = [];
    for (var p of PILAR) {
        var pos = posisiPetak(p[0], p[1]);
        daftarPilar.push({ bentuk: pilar, x: pos.x, y: TINGGI_PILAR / 2, z: pos.z });
        daftarAtas.push({ bentuk: atasPilar, x: pos.x, y: TINGGI_PILAR + 0.03, z: pos.z });
    }

    var pp = gabung(daftarPilar);
    var pa = gabung(daftarAtas);
    arena.addChild(new Objek(GL, pp.vertex, pp.faces, [0.74, 0.74, 0.76]));
    arena.addChild(new Objek(GL, pa.vertex, pa.faces, [0.62, 0.62, 0.65]));

    return arena;
}
