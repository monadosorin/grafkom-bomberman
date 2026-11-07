import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid,    // ellipsoid
    buatKapsul,       // ellipsoid modifikasi
    buatTabung,       // cylinder
    buatKerucut,      // cone modifikasi
    buatHiperboloid2, // hyperboloid 2 sheet modifikasi
    buatParaboloid,   // elliptic paraboloid
    buatTorus,        // toroid / toroid modifikasi
    buatLingkaran,    // circle
    buatKotak,        // cube modifikasi
    generateBSpline,  // kurva B-spline, titik2 kurva untuk mesh mengikuti kurva
    buatMeshKurva     // mesh mengikuti kurva (sapuan penampang di sepanjang kurva)
} from "../shared/bentuk.js"; // semua bentuk dipakai dari file bersama kelompok

// =====================================================================
// GOLEM BOMBER - pembagian bentuk sesuai Dokumen Penjelasan
//
// Kepala            : ellipsoid + cylinder + cone modifikasi + toroid
// Pundak & Armor    : elliptic paraboloid (shoulder pad) + mesh mengikuti kurva
//                     + toroid modifikasi + cube modifikasi + ellipsoid modifikasi
// Badan             : ellipsoid
// Tangan            : ellipsoid + cylinder + elliptic paraboloid
// Kaki              : ellipsoid + cylinder + hyperboloid 2 sheet modifikasi + circle
// Aksesori (Tanaman & Bunga) : mesh mengikuti kurva + cone modifikasi (kelopak)
// =====================================================================

var SKALA = 0.7;

// warna dalam format [r, g, b], nilai 0 sampai 1
var WARNA = {
    oranye: [0.98, 0.55, 0.22],
    oranyeGelap: [0.85, 0.45, 0.15],
    hijau: [0.55, 0.78, 0.42],
    hijauTua: [0.3, 0.55, 0.25],
    lumut: [0.5, 0.72, 0.3],
    abu: [0.78, 0.79, 0.77],
    abuGelap: [0.3, 0.3, 0.32],
    hitam: [0.1, 0.1, 0.11],
    kuning: [1.0, 0.72, 0.2],
    kuningTua: [0.95, 0.6, 0.15],
    mata: [0.95, 0.92, 0.45],
    kelopak: [0.9, 0.84, 0.96],
    emas: [0.85, 0.65, 0.35]
};

// sendi (pivot) yang diatur di aturPoseDiam
var badanPivot, kepalaPivot, antenaPivot, bungaPivot;
var bahuKiri, bahuKanan, sikuKiri, sikuKanan;
var pinggulKiri, pinggulKanan, telapakKiri, telapakKanan;

// posisi dasar sendi, dipakai juga saat mengatur pose
var POS_BAHU = { x: 1.5, y: 2.0, z: 0.05 };
var POS_SIKU = { y: -0.6 };
var POS_PINGGUL = { x: 0.4, y: 0.82, z: 0.05 };
var POS_KEPALA = { x: 0, y: 1.6, z: 0 };
var POS_ANTENA = { x: -0.08, y: 1.23, z: 0.07 };
var POS_BUNGA = { x: -0.42, y: 1.07, z: 0.12 };
var TINGGI_KAKI = 0.62;
var CONDONG = 0.06;

/* ===================== FUNGSI PEMBANTU ===================== */

// mengatur rotasi dan posisi sebuah objek (dipakai untuk menaruh bentuk dan mengatur pose)
function atur(objek, x, y, z, rx, ry, rz) {
    var m = objek.MOVEMATRIX;
    LIBS.set_I4(m);
    if (rz) LIBS.rotateZ(m, rz);
    if (ry) LIBS.rotateY(m, ry);
    if (rx) LIBS.rotateX(m, rx);
    LIBS.set_position(m, x, y, z);
}

// membungkus hasil fungsi bentuk ({ vertex, faces }) menjadi Objek berwarna
function bentuk(GL, geo, warna, x, y, z, rx, ry, rz) {
    var o = new Objek(GL, geo.vertex, geo.faces, warna);
    atur(o, x, y, z, rx || 0, ry || 0, rz || 0);
    return o;
}

// jalan pintas untuk ellipsoid dengan kehalusan tetap 20 x 20
function ellipsoid(GL, a, b, c, warna, x, y, z, rx, ry, rz) {
    return bentuk(GL, buatEllipsoid(a, b, c, 20, 20), warna, x, y, z, rx, ry, rz);
}

// sendi kosong tanpa bentuk, jadi titik putar bagi anak-anaknya
function pivot(GL, x, y, z) {
    var o = new Objek(GL);
    atur(o, x, y, z, 0, 0, 0);
    return o;
}

// membuat satu daun dari kurva B-spline (dipakai lumut dan daun bunga)
function buatDaun(panjang, lebar) {
    var kurva = generateBSpline([
        0, 0,
        0.2 * panjang, 0.3 * panjang,
        0.05 * panjang, 0.65 * panjang,
        -0.15 * panjang, panjang
    ], 14, 3);
    return buatMeshKurva(kurva, lebar, 0.012, function (t) {
        return Math.pow(Math.sin(Math.PI * t), 0.7);
    }, 8);
}

/* ===================== KEPALA ===================== */
// ellipsoid + cylinder + cone modifikasi + toroid

function buatKepala(GL) {
    var kepala = pivot(GL, POS_KEPALA.x, POS_KEPALA.y, POS_KEPALA.z);

    kepala.addChild(ellipsoid(GL, 0.92, 0.85, 0.82, WARNA.oranye, 0, 0, 0));  // ellipsoid: kepala bulat besar
    kepala.addChild(ellipsoid(GL, 0.56, 0.42, 0.5, WARNA.oranye, 0, 0.85, 0.12));  // ellipsoid: kubah helm di atas
    kepala.addChild(ellipsoid(GL, 0.34, 0.1, 0.12, WARNA.hitam, 0, 0.93, 0.52));  // ellipsoid: visor hitam pipih
    kepala.addChild(ellipsoid(GL, 0.07, 0.07, 0.04, WARNA.mata, 0.17, 0.93, 0.62));  // ellipsoid: mata kuning

    // toroid: kerah gelap di bawah kepala (pita tipis melingkari bawah bola)
    kepala.addChild(bentuk(GL, buatTorus(0.5, 0.44, 0.07, 0.07, 10, 24), WARNA.abuGelap, 0, -0.72, 0));

    kepalaPivot = kepala;
    buatEmblem(GL, kepala);
    buatAntena(GL, kepala);
    buatTanaman(GL, kepala);
    return kepala;
}

function buatEmblem(GL, kepala) {
    kepala.addChild(ellipsoid(GL, 0.3, 0.25, 0.1, WARNA.kuning, 0, -0.15, 0.74));  // ellipsoid: tengkorak babi kuning
    kepala.addChild(ellipsoid(GL, 0.07, 0.1, 0.03, WARNA.hitam, -0.1, -0.13, 0.82));  // ellipsoid: lubang hidung kiri
    kepala.addChild(ellipsoid(GL, 0.07, 0.1, 0.03, WARNA.hitam, 0.1, -0.13, 0.82));  // ellipsoid: lubang hidung kanan

    // cone modifikasi: tiga duri korona. kerucut di bentuk.js ujungnya di (0,0,0)
    // dan alasnya di atas, jadi diputar 180 derajat (PI di sumbu x) agar ujung menghadap atas.
    var PI = Math.PI;
    kepala.addChild(bentuk(GL, buatKerucut(0.07, 0.2, 0.07, 4, 10), WARNA.kuningTua, -0.15, 0.27, 0.83, PI + 0.1, 0, -0.3));
    kepala.addChild(bentuk(GL, buatKerucut(0.07, 0.26, 0.07, 4, 10), WARNA.kuningTua, 0, 0.34, 0.84, PI + 0.1, 0, 0));
    kepala.addChild(bentuk(GL, buatKerucut(0.07, 0.2, 0.07, 4, 10), WARNA.kuningTua, 0.15, 0.27, 0.83, PI + 0.1, 0, 0.3));
}

function buatAntena(GL, kepala) {
    antenaPivot = pivot(GL, POS_ANTENA.x, POS_ANTENA.y, POS_ANTENA.z);
    antenaPivot.addChild(bentuk(GL, buatTabung(0.025, 0.45, 8), WARNA.abuGelap, 0, 0, 0));  // cylinder: tangkai (dari y=0 ke atas)
    antenaPivot.addChild(ellipsoid(GL, 0.15, 0.15, 0.15, WARNA.hijau, 0, 0.55, 0));  // ellipsoid: bola hijau di ujung
    kepala.addChild(antenaPivot);
}

/* ===================== AKSESORI (TANAMAN & BUNGA) ===================== */
// mesh mengikuti kurva + cone modifikasi (kelopak bunga)

function buatTanaman(GL, kepala) {
    // lumut: beberapa daun dari mesh kurva, mengembang di sisi kiri dan kanan kepala
    [-1, 1].forEach(function (s) {
        kepala.addChild(bentuk(GL, buatDaun(0.62, 0.13), WARNA.lumut, s * 0.55, 0.55, 0.35, 0, 0, s * -0.5));
        kepala.addChild(bentuk(GL, buatDaun(0.52, 0.12), WARNA.hijauTua, s * 0.62, 0.35, 0.4, 0, 0, s * -0.1));
        kepala.addChild(bentuk(GL, buatDaun(0.46, 0.11), WARNA.lumut, s * 0.7, 0.1, 0.38, 0, 0, s * 0.3));
        kepala.addChild(bentuk(GL, buatDaun(0.38, 0.1), WARNA.hijauTua, s * 0.45, 0.7, 0.3, 0, 0, s * -0.9));
    });

    bungaPivot = pivot(GL, POS_BUNGA.x, POS_BUNGA.y, POS_BUNGA.z);

    // tangkai bunga: mesh kurva berpenampang bulat tipis, agak melengkung
    var kurvaTangkai = generateBSpline([0, 0, 0.04, 0.1, -0.04, 0.22, 0, 0.38], 12, 3);
    bungaPivot.addChild(bentuk(GL, buatMeshKurva(kurvaTangkai, 0.018, 0.018, null, 8), WARNA.hijauTua, 0, 0, 0));
    bungaPivot.addChild(bentuk(GL, buatDaun(0.2, 0.05), WARNA.hijauTua, 0, 0.08, 0, 0, 0, 0.9));

    // cone modifikasi: kelopak. ujung kerucut di pusat bunga, alas yang melebar di ujung kelopak
    for (var k = 0; k < 6; k++) {
        var sudut = k * Math.PI / 3;
        bungaPivot.addChild(bentuk(GL, buatKerucut(0.055, 0.14, 0.015, 3, 8), WARNA.kelopak,
            0, 0.42, 0.02, 0, 0, sudut - Math.PI / 2));
    }
    bungaPivot.addChild(ellipsoid(GL, 0.06, 0.06, 0.05, WARNA.kuning, 0, 0.42, 0.04));  // ellipsoid: putik kuning
    kepala.addChild(bungaPivot);
}

/* ===================== BADAN ===================== */
// ellipsoid (+ gesper cube modifikasi dan sendi ellipsoid modifikasi yang termasuk armor)

function buatBadan(GL, induk) {
    induk.addChild(ellipsoid(GL, 0.5, 0.28, 0.45, WARNA.oranye, 0, 0.78, 0));  // ellipsoid: badan kecil di bawah kepala

    induk.addChild(bentuk(GL, buatKotak(0.22, 0.14, 0.06), WARNA.emas, 0, 0.78, 0.44));  // cube modifikasi: gesper di depan

    // ellipsoid modifikasi (kapsul): sendi abu di kiri dan kanan badan
    induk.addChild(bentuk(GL, buatKapsul(0.11, 0.08, 0.11, 0.12, 12, 10), WARNA.abu, -0.4, 0.86, 0.28, 0.4, 0, -0.5));
    induk.addChild(bentuk(GL, buatKapsul(0.11, 0.08, 0.11, 0.12, 12, 10), WARNA.abu, 0.4, 0.86, 0.28, 0.4, 0, 0.5));
}

/* ===================== PUNDAK & ARMOR ===================== */
// elliptic paraboloid + toroid modifikasi + cube modifikasi + ellipsoid modifikasi

// satu pundak = 2 elliptic paraboloid (atas dan bawah) yang disatukan di bibirnya
function buatPundak(GL, induk, cx, cy, cz) {
    var r = 0.6, h = 0.6;
    induk.addChild(bentuk(GL, buatParaboloid(r, h, r, 10, 24), WARNA.oranye, cx, cy + h, cz, Math.PI, 0, 0));
    induk.addChild(bentuk(GL, buatParaboloid(r, h, r, 10, 24), WARNA.oranye, cx, cy - h, cz));
    // toroid modifikasi: tabung gemuk berpenampang lonjong (tinggi > tebal) di sambungan,
    // supaya pertemuan dua mangkok membulat seperti bola
    induk.addChild(bentuk(GL, buatTorus(r - 0.08, r - 0.08, 0.14, 0.3, 12, 28), WARNA.oranye, cx, cy, cz));
}

function buatBahuPelindung(GL, induk) {
    buatPundak(GL, induk, -1.15, 2.3, -0.1);
    buatPundak(GL, induk, 1.15, 2.3, -0.1);

    // cube modifikasi: tanda X di pundak kiri dari dua balok tipis bersilang
    var garis = buatKotak(0.34, 0.045, 0.06);
    induk.addChild(bentuk(GL, garis, WARNA.hitam, -1.2, 2.42, 0.57, 0, 0, 0.7));
    induk.addChild(bentuk(GL, garis, WARNA.hitam, -1.2, 2.42, 0.57, 0, 0, -0.7));

    // ellipsoid modifikasi (kapsul): tanda sabit di pundak kanan dari kapsul-kapsul kecil membentuk busur
    for (var k = 0; k < 4; k++) {
        var a = -0.2 + k * 0.45;
        induk.addChild(bentuk(GL, buatKapsul(0.025, 0.02, 0.025, 0.06, 6, 8), WARNA.hitam,
            1.2 + 0.12 * Math.sin(a), 2.55 - 0.12 * Math.cos(a), 0.6, 0, 0, -a + 1.2));
    }
}

// armor lengan: mesh kurva (pelat melengkung yang melebar ke siku) + toroid modifikasi (cincin abu)
function buatArmorLengan(GL, bahu) {
    // titik kontrol kurva lengan (x, y) dari bahu ke siku, sedikit melengkung
    var kurva = generateBSpline([0, 0.15, 0.06, -0.1, -0.03, -0.35, 0, -0.62], 14, 3);
    bahu.addChild(bentuk(GL, buatMeshKurva(kurva, 0.42, 0.4, function (t) {
        return 0.85 + 0.3 * t;
    }, 20), WARNA.oranye, 0, 0, 0));  // mesh: pelat lengan atas
    // toroid modifikasi: cincin abu pipih di ujung bawah pelat
    bahu.addChild(bentuk(GL, buatTorus(0.5, 0.47, 0.05, 0.06, 8, 24), WARNA.abu, 0, -0.6, 0));
}

/* ===================== TANGAN ===================== */
// ellipsoid + cylinder + elliptic paraboloid

function buatTangan(GL, sisi) {
    var bahu = pivot(GL, sisi * POS_BAHU.x, POS_BAHU.y, POS_BAHU.z);
    buatArmorLengan(GL, bahu);

    var siku = pivot(GL, 0, POS_SIKU.y, 0);
    // cylinder: batang sendi abu menembus siku ke samping (diputar 90 derajat di sumbu Z)
    siku.addChild(bentuk(GL, buatTabung(0.15, 0.95, 12), WARNA.abu, 0.475, 0, 0, 0, 0, Math.PI / 2));
    // elliptic paraboloid: manset oranye melebar di bawah siku, dibalik 180 derajat agar terbuka ke bawah
    siku.addChild(bentuk(GL, buatParaboloid(0.5, 0.4, 0.5, 8, 24), WARNA.oranye, 0, 0.2, 0.02, Math.PI, 0, 0));
    // ellipsoid: kepalan hijau besar
    siku.addChild(ellipsoid(GL, 0.66, 0.66, 0.66, WARNA.hijau, 0, -0.7, 0.12));
    bahu.addChild(siku);

    if (sisi < 0) { bahuKiri = bahu; sikuKiri = siku; }
    else { bahuKanan = bahu; sikuKanan = siku; }
    return bahu;
}

/* ===================== KAKI ===================== */
// ellipsoid + cylinder + hyperboloid 2 sheet modifikasi + circle

function buatKaki(GL, sisi) {
    var pinggul = pivot(GL, sisi * POS_PINGGUL.x, POS_PINGGUL.y, POS_PINGGUL.z);
    pinggul.addChild(ellipsoid(GL, 0.27, 0.36, 0.27, WARNA.oranye, 0, -0.2, 0));  // ellipsoid: paha oranye

    var telapak = pivot(GL, 0, -TINGGI_KAKI, 0);
    telapak.addChild(bentuk(GL, buatTabung(0.17, 0.2, 12), WARNA.abu, 0, -0.05, 0));  // cylinder: pergelangan abu

    // hyperboloid 2 sheet modifikasi: telapak hijau berbentuk gundukan.
    // rx/rz/ry dihitung dari lebar bibir dan tinggi gundukan yang diinginkan.
    var vMax = 0.3;
    var bibirX = 0.36, bibirZ = 0.46, tinggi = 0.24;
    var rx = bibirX / Math.tan(vMax);
    var rz = bibirZ / Math.tan(vMax);
    var ry = tinggi / (1 / Math.cos(vMax) - 1);
    var yBibir = ry / Math.cos(vMax);
    // dibalik 180 derajat agar mangkok jadi gundukan; bibir diturunkan sampai menyentuh tanah (y = -0.2)
    telapak.addChild(bentuk(GL, buatHiperboloid2(rx, ry, rz, vMax, 10, 24), WARNA.hijau,
        0, -0.2 + yBibir, 0.1, Math.PI, 0, 0));
    // circle: penutup telapak kaki (alas datar) tepat di bibir gundukan
    telapak.addChild(bentuk(GL, buatLingkaran(bibirX, bibirZ, 24), WARNA.hijauTua, 0, -0.2, 0.1));
    pinggul.addChild(telapak);

    if (sisi < 0) { pinggulKiri = pinggul; telapakKiri = telapak; }
    else { pinggulKanan = pinggul; telapakKanan = telapak; }
    return pinggul;
}

/* ===================== KARAKTER ===================== */

export function buatGolemBomber(GL) {
    var root = new Objek(GL);
    LIBS.scale(root.MOVEMATRIX, SKALA, SKALA, SKALA);

    badanPivot = pivot(GL, 0, 0, 0);
    root.addChild(badanPivot);

    buatBadan(GL, badanPivot);
    buatBahuPelindung(GL, badanPivot);
    badanPivot.addChild(buatKepala(GL));
    badanPivot.addChild(buatTangan(GL, -1));
    badanPivot.addChild(buatTangan(GL, 1));
    badanPivot.addChild(buatKaki(GL, -1));
    badanPivot.addChild(buatKaki(GL, 1));

    aturPoseDiam();

    return root;
}

/* ===================== ANIMASI ===================== */

/* ===================== POSE DIAM ===================== */

// pose berdiri santai, dipasang satu kali saat karakter dibuat
function aturPoseDiam() {
    atur(badanPivot, 0, 0.01, 0, CONDONG, 0, 0);   // condong sedikit; 0.01 biar alas telapak tidak berimpit dengan lantai
    atur(pinggulKiri, -POS_PINGGUL.x, POS_PINGGUL.y, POS_PINGGUL.z, 0, 0, 0);
    atur(pinggulKanan, POS_PINGGUL.x, POS_PINGGUL.y, POS_PINGGUL.z, 0, 0, 0);
    atur(telapakKiri, 0, -TINGGI_KAKI, 0, -CONDONG, 0, 0);   // telapak diputar balik agar rata dengan tanah
    atur(telapakKanan, 0, -TINGGI_KAKI, 0, -CONDONG, 0, 0);
    atur(bahuKiri, -POS_BAHU.x, POS_BAHU.y, POS_BAHU.z, 0, 0, -0.12);   // tangan sedikit membuka ke samping
    atur(bahuKanan, POS_BAHU.x, POS_BAHU.y, POS_BAHU.z, 0, 0, 0.12);
    atur(sikuKiri, 0, POS_SIKU.y, 0, -0.3, 0, 0);            // siku menekuk sedikit
    atur(sikuKanan, 0, POS_SIKU.y, 0, -0.3, 0, 0);
    atur(kepalaPivot, POS_KEPALA.x, POS_KEPALA.y, POS_KEPALA.z, 0, 0, 0);
    atur(antenaPivot, POS_ANTENA.x, POS_ANTENA.y, POS_ANTENA.z, 0, 0, 0.3);   // antena miring ke kiri
    atur(bungaPivot, POS_BUNGA.x, POS_BUNGA.y, POS_BUNGA.z, 0, 0, 0.1);
}

// tidak ada animasi. fungsi ini tetap ada karena main.js dan preview.html memanggilnya tiap frame
export function animasiGolemBomber(time) {
}