import { LIBS } from "./libs.js";
import { Objek } from "./objek.js";

// semua proyeksi di bagan "taxonomy of projection"
// jenis: "ortho" = parallel orthographic, "oblique" = parallel miring, "persp" = perspective
// yaw = kamera muter kiri kanan, pitch = kamera nunduk (derajat)
// zoom = biar muat di layar, dikali ukuran dari halaman
export var DAFTAR_PROYEKSI = [
    { grup: "PARALLEL - Orthographic", nama: "Top (plan)", jenis: "ortho", yaw: 0, pitch: 90, zoom: 1 },
    { grup: "PARALLEL - Orthographic", nama: "Front elevation", jenis: "ortho", yaw: 0, pitch: 0, zoom: 1 },
    { grup: "PARALLEL - Orthographic", nama: "Side elevation", jenis: "ortho", yaw: 90, pitch: 0, zoom: 1 },
    { grup: "PARALLEL - Axonometric", nama: "Isometric", jenis: "ortho", yaw: 45, pitch: 35.264, zoom: 1.2 },
    { grup: "PARALLEL - Axonometric", nama: "Other: dimetric", jenis: "ortho", yaw: 45, pitch: 20, zoom: 1.2 },
    { grup: "PARALLEL - Oblique", nama: "Cavalier", jenis: "oblique", panjang: 1, sudut: 45, zoom: 1.25 },
    { grup: "PARALLEL - Oblique", nama: "Cabinet", jenis: "oblique", panjang: 0.5, sudut: 45, zoom: 1.25 },
    { grup: "PARALLEL - Oblique", nama: "Other: 30 derajat, 0.75", jenis: "oblique", panjang: 0.75, sudut: 30, zoom: 1.25 },
    { grup: "PERSPECTIVE", nama: "One-point", jenis: "persp", yaw: 0, pitch: 0, jarak: 1 },
    { grup: "PERSPECTIVE", nama: "Two-point", jenis: "persp", yaw: -36, pitch: 0, jarak: 1 },
    { grup: "PERSPECTIVE", nama: "Three-point", jenis: "persp", yaw: -36, pitch: 35, jarak: 0.95 }
];

// salin isi matrix baru ke matrix punya engine
function salin(tujuan, sumber) {
    for (var i = 0; i < 16; i++) tujuan[i] = sumber[i];
}

// kamera muter yaw & pitch, terus ngeliat titik (0, tengah, 0) dari jarak sekian
function kamera(VIEW, yaw, pitch, tengah, jarak) {
    LIBS.set_I4(VIEW);
    LIBS.rotateY(VIEW, yaw);
    LIBS.rotateX(VIEW, pitch);
    // titik (0, tengah, 0) abis diputar = tengah x kolom ke-2 matrix (VIEW[4], VIEW[5], VIEW[6])
    // dikurangin biar titik itu pas di tengah layar, terus mundur sejauh jarak
    LIBS.set_position(VIEW, -tengah * VIEW[4], -tengah * VIEW[5], -jarak - tengah * VIEW[6]);
}

// shear buat oblique: x sama y digeser sebanding kedalaman z
// diitung dari bidang z0 (tengah karakter), yang makin ke belakang digambar makin ke kanan atas
// panjang = seberapa panjang kedalamannya digambar, sudut = arah miringnya
function shear(panjang, sudut, z0) {
    var kx = -panjang * Math.cos(sudut);
    var ky = -panjang * Math.sin(sudut);
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        kx, ky, 1, 0,
        -kx * z0, -ky * z0, 0, 1
    ];
}

// isi PROJ sama VIEW sesuai proyeksi p
// tinggi = setengah tinggi yang keliatan (buat parallel), tengah = tinggi titik tengah karakter
export function aturProyeksi(p, PROJ, VIEW, aspek, tinggi, tengah) {
    var rad = Math.PI / 180;

    if (p.jenis == "ortho") {
        // orthographic: matrix get_ortho, bedanya cuma arah kamera
        salin(PROJ, LIBS.get_ortho(tinggi * p.zoom, aspek, 0.5, 150));
        kamera(VIEW, p.yaw * rad, p.pitch * rad, tengah, 20);
    } else if (p.jenis == "oblique") {
        // oblique: kamera lurus dari depan, tapi matrixnya orthographic x shear
        var ortho = LIBS.get_ortho(tinggi * p.zoom, aspek, 0.5, 150);
        salin(PROJ, LIBS.multiply(ortho, shear(p.panjang, p.sudut * rad, -20)));
        kamera(VIEW, 0, 0, tengah, 20);
    } else {
        // perspective: matrix get_projection, jumlah titik hilangnya tergantung arah kamera
        salin(PROJ, LIBS.get_projection(40, aspek, 0.5, 150));
        kamera(VIEW, p.yaw * rad, p.pitch * rad, tengah, tinggi * 3.2 * p.jarak);
    }
}

// menu di pojok kiri atas, ganti pake panah kiri / kanan atau klik
// return function yang ngasih proyeksi yang lagi dipilih
export function pilihProyeksi() {
    var nomor = 1;
    var n = DAFTAR_PROYEKSI.length;

    var kotak = document.createElement("div");
    kotak.style.cssText = "position: absolute; left: 12px; top: 12px; padding: 10px 14px; background: rgba(0, 0, 0, 0.6);"
        + " color: white; font: 12px monospace; line-height: 1.5; border-radius: 6px; user-select: none";
    document.body.appendChild(kotak);

    function tulis() {
        var html = "", grup = "";
        for (var i = 0; i < n; i++) {
            var p = DAFTAR_PROYEKSI[i];
            if (p.grup != grup) {
                grup = p.grup;
                html += "<div style='color: #9fb3c8; margin-top: 4px'>" + grup + "</div>";
            }
            var aktif = i == nomor;
            html += "<div data-i='" + i + "' style='cursor: pointer; padding-left: 10px;"
                + (aktif ? " color: #ffd34d; font-weight: bold" : "") + "'>"
                + (aktif ? "> " : "  ") + p.nama + "</div>";
        }
        html += "<div style='color: #9fb3c8; margin-top: 6px'>panah kiri / kanan atau klik</div>";
        kotak.innerHTML = html;
    }

    kotak.addEventListener("click", function (e) {
        var i = e.target.getAttribute("data-i");
        if (i !== null) {
            nomor = Number(i);
            tulis();
        }
    });

    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowRight") nomor = (nomor + 1) % n;
        else if (e.key == "ArrowLeft") nomor = (nomor - 1 + n) % n;
        else return;
        tulis();
    });

    tulis();
    return function () {
        return DAFTAR_PROYEKSI[nomor];
    };
}

// lantai kotak2 kecil biar keliatan bedanya tiap proyeksi
// n x n petak ukuran s, warnanya selang seling
export function buatLantaiKotak(GL, n, s) {
    var terang = { vertex: [], faces: [] };
    var gelap = { vertex: [], faces: [] };
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            var t = (i + j) % 2 == 0 ? terang : gelap;
            var x = (i - n / 2) * s, z = (j - n / 2) * s;
            var awal = t.vertex.length / 3;
            t.vertex.push(x, 0, z, x + s, 0, z, x + s, 0, z + s, x, 0, z + s);
            t.faces.push(awal, awal + 2, awal + 1, awal, awal + 3, awal + 2);
        }
    }
    var lantai = new Objek(GL);
    lantai.addChild(new Objek(GL, terang.vertex, terang.faces, [0.85, 0.87, 0.9]));
    lantai.addChild(new Objek(GL, gelap.vertex, gelap.faces, [0.45, 0.48, 0.55]));
    return lantai;
}
