import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid, buatTabung } from "../shared/bentuk.js";
import { buatOvoid } from "../shared/bentuk.js";
import { buatFrustum } from "../shared/bentuk.js";
import { buatKapsul } from "../shared/bentuk.js";
import { buatHiperboloid2 } from "../shared/bentuk.js";
import { buatLingkaran } from "../shared/bentuk.js";
import { buatKotak } from "../shared/bentuk.js";
import { buatTorus } from "../shared/bentuk.js";
import { buatParaboloid } from "../shared/bentuk.js";

// Node yang diakses oleh loop animasi diekspos di scope modul
export var root, badan, kepala, antena;
export var bahuKiri, bahuKanan;
export var pinggulKiri, pinggulKanan;

export function buatWhiteBomber(GL) {
    var warnaMerah = [0.9, 0.3, 0.45];
    var warnaPutih = [1, 1, 1];
    var warnaBiru  = [0.2, 0.2, 0.9];
    var warnaHitam = [0, 0, 0];
    var warnaKulit = [0.9, 0.7, 0.5];

    // Root node
    root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 1, 0);

    //-------------------------------------TORSO----------------------------------------------
    var torso = buatOvoid(0.3, 0.4, 0.3, 0.28, 20, 20);
    badan = new Objek(GL, torso.vertex, torso.faces, warnaBiru);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.1, 0);
    root.addChild(badan);

    // Sabuk hitam
    var sh = buatTabung(0.32, 0.1, 20);
    var sabukHitam = new Objek(GL, sh.vertex, sh.faces, warnaHitam);
    LIBS.set_position(sabukHitam.MOVEMATRIX, 0, -0.2, 0);
    badan.addChild(sabukHitam);

    // Belt buckle kuning
    var bb = buatKotak(0.15, 0.1, 0.02);
    var beltBuckle = new Objek(GL, bb.vertex, bb.faces, [0.9, 0.9, 0]);
    LIBS.set_position(beltBuckle.MOVEMATRIX, 0, 0.05, 0.33);
    sabukHitam.addChild(beltBuckle);

    // Belt buckle hitam dalam
    var bb2 = buatKotak(0.1, 0.05, 0.02);
    var beltBuckleHitam = new Objek(GL, bb2.vertex, bb2.faces, warnaHitam);
    LIBS.set_position(beltBuckleHitam.MOVEMATRIX, 0, 0.05, 0.331);
    sabukHitam.addChild(beltBuckleHitam);

    //-------------------------------------KEPALA----------------------------------------------
    // Pivot kepala
    kepala = new Objek(GL);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.8, 0);
    badan.addChild(kepala);

    // Helm
    var h = buatKapsul(0.454, 0.28, 0.35, 0.2, 20, 20);
    var helm = new Objek(GL, h.vertex, h.faces, warnaPutih);
    LIBS.set_position(helm.MOVEMATRIX, 0, 0, -0.06);
    kepala.addChild(helm);

    // Lis Hitam
    var l = buatHiperboloid2(1.3, 2, 1, 0.3, 20, 20);
    var lisHitam = new Objek(GL, l.vertex, l.faces, warnaHitam);
    LIBS.set_position(lisHitam.MOVEMATRIX, 0, 0, -1.8);
    LIBS.rotateX(lisHitam.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(lisHitam);

    // Muka
    var m = buatHiperboloid2(1.3, 1.9, 1, 0.3, 20, 20);
    var muka = new Objek(GL, m.vertex, m.faces, warnaKulit);
    LIBS.set_position(muka.MOVEMATRIX, 0, 0, 2.25);
    LIBS.rotateX(muka.MOVEMATRIX, -Math.PI / 2);
    kepala.addChild(muka);

    // Mata
    var ma = buatLingkaran(0.03, 0.2, 20);
    var mataKiri = new Objek(GL, ma.vertex, ma.faces, warnaHitam);
    var mataKanan = new Objek(GL, ma.vertex, ma.faces, warnaHitam);
    LIBS.set_position(mataKiri.MOVEMATRIX, -0.15, 0, 0.35);
    LIBS.set_position(mataKanan.MOVEMATRIX, 0.15, 0, 0.35);
    LIBS.rotateX(mataKiri.MOVEMATRIX, Math.PI / 2);
    LIBS.rotateX(mataKanan.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(mataKiri);
    kepala.addChild(mataKanan);

    // Helm Torus
    var ht = buatTorus(0.43, 0.34, 0.07, 0.3, 20, 20);
    var helmTorus = new Objek(GL, ht.vertex, ht.faces, warnaPutih);
    LIBS.set_position(helmTorus.MOVEMATRIX, 0, 0, 0.05);
    LIBS.rotateX(helmTorus.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(helmTorus);

    // Pivot Antena
    antena = new Objek(GL);
    LIBS.set_position(antena.MOVEMATRIX, 0, 0.3, -0.3);
    kepala.addChild(antena);

    // Batang antena
    var tk = buatFrustum(0.03, 0.04, 0.3, 20, 20);
    var frustumKepala = new Objek(GL, tk.vertex, tk.faces, warnaPutih);
    LIBS.rotateX(frustumKepala.MOVEMATRIX, -Math.PI / 4);
    antena.addChild(frustumKepala);

    // Bola antena
    var bk = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var bolaKepala = new Objek(GL, bk.vertex, bk.faces, warnaMerah);
    LIBS.set_position(bolaKepala.MOVEMATRIX, 0, 0.3, -0.3);
    antena.addChild(bolaKepala);

    //-------------------------------------TANGAN----------------------------------------------
    var tanganGeom = buatFrustum(0.03, 0.1, 0.5, 20, 20);
    var bolaTanganGeom = buatEllipsoid(0.16, 0.16, 0.16, 20, 20);

    // Pivot Bahu Kiri
    bahuKiri = new Objek(GL);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.28, 0.22, 0);
    badan.addChild(bahuKiri);

    var tanganKiri = new Objek(GL, tanganGeom.vertex, tanganGeom.faces, warnaPutih);
    LIBS.rotateZ(tanganKiri.MOVEMATRIX, 0.5); // Mengarah ke bawah-luar
    LIBS.rotateX(tanganKiri.MOVEMATRIX, Math.PI);
    bahuKiri.addChild(tanganKiri);

    var bolaTanganKiri = new Objek(GL, bolaTanganGeom.vertex, bolaTanganGeom.faces, warnaMerah);
    LIBS.set_position(bolaTanganKiri.MOVEMATRIX, 0, 0.55, 0);
    tanganKiri.addChild(bolaTanganKiri);

    // Pivot Bahu Kanan
    bahuKanan = new Objek(GL);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.28, 0.22, 0);
    badan.addChild(bahuKanan);

    var tanganKanan = new Objek(GL, tanganGeom.vertex, tanganGeom.faces, warnaPutih);
    LIBS.rotateZ(tanganKanan.MOVEMATRIX, -0.5);
    LIBS.rotateX(tanganKanan.MOVEMATRIX, Math.PI);
    bahuKanan.addChild(tanganKanan);

    var bolaTanganKanan = new Objek(GL, bolaTanganGeom.vertex, bolaTanganGeom.faces, warnaMerah);
    LIBS.set_position(bolaTanganKanan.MOVEMATRIX, 0, 0.55, 0);
    tanganKanan.addChild(bolaTanganKanan);

    //-------------------------------------KAKI----------------------------------------------
    // Pivot Pinggul
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.16, -0.35, 0);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.16, -0.35, 0);
    badan.addChild(pinggulKiri);
    badan.addChild(pinggulKanan);

    // Paha/Kaki
    var kk = buatFrustum(0.05, 0.10, 0.5, 20, 20);
    var kakiKiri = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    var kakiKanan = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    LIBS.rotateX(kakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateX(kakiKanan.MOVEMATRIX, Math.PI);
    pinggulKiri.addChild(kakiKiri);
    pinggulKanan.addChild(kakiKanan);

    // Sepatu (Bola + Paraboloid)
    var bolaKaki = buatEllipsoid(0.15, 0.15, 0.15, 20, 20);
    var ujungKaki = buatParaboloid(0.14, 0.28, 0.14, 20, 20);

    var bolaKakiKiri = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, warnaMerah);
    var bolaKakiKanan = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, warnaMerah);
    LIBS.set_position(bolaKakiKiri.MOVEMATRIX, 0, 0.5, 0);
    LIBS.set_position(bolaKakiKanan.MOVEMATRIX, 0, 0.5, 0);
    LIBS.rotateX(bolaKakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateX(bolaKakiKanan.MOVEMATRIX, Math.PI);
    kakiKiri.addChild(bolaKakiKiri);
    kakiKanan.addChild(bolaKakiKanan);

    var ujungKakiKiri = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, warnaMerah);
    var ujungKakiKanan = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, warnaMerah);
    LIBS.set_position(ujungKakiKiri.MOVEMATRIX, 0, 0, 0.3);
    LIBS.set_position(ujungKakiKanan.MOVEMATRIX, 0, 0, 0.3);
    LIBS.rotateX(ujungKakiKiri.MOVEMATRIX, -Math.PI / 2);
    LIBS.rotateX(ujungKakiKanan.MOVEMATRIX, -Math.PI / 2);
    bolaKakiKiri.addChild(ujungKakiKiri);
    bolaKakiKanan.addChild(ujungKakiKanan);

    return root;
}

export function animasiWhiteBomber(time) {
    if (!root || !badan || !pinggulKiri || !pinggulKanan || !bahuKiri || !bahuKanan) return;

    var t = time / 1000;

    // 2. Ayunan kaki bolak-balik
    var stepFreq = t * 2 * Math.PI * 0.9;
    var ayunKaki = Math.sin(stepFreq) * 0.45;

    LIBS.set_I4(pinggulKiri.MOVEMATRIX);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.16, -0.35, 0);
    LIBS.rotateX(pinggulKiri.MOVEMATRIX, ayunKaki);

    LIBS.set_I4(pinggulKanan.MOVEMATRIX);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.16, -0.35, 0);
    LIBS.rotateX(pinggulKanan.MOVEMATRIX, -ayunKaki);

    // 3. Ayunan lengan (berlawanan fase dengan kaki)
    var ayunLengan = ayunKaki * 0.8;

    LIBS.set_I4(bahuKiri.MOVEMATRIX);
    LIBS.set_position(bahuKiri.MOVEMATRIX, -0.18, 0.22, 0);
    LIBS.rotateX(bahuKiri.MOVEMATRIX, -ayunLengan);

    LIBS.set_I4(bahuKanan.MOVEMATRIX);
    LIBS.set_position(bahuKanan.MOVEMATRIX, 0.18, 0.22, 0);
    LIBS.rotateX(bahuKanan.MOVEMATRIX, ayunLengan);

    // 4. Bobbing badan (naik-turun saat melangkah)
    var bounce = Math.abs(Math.sin(stepFreq)) * 0.04;
    LIBS.set_I4(badan.MOVEMATRIX);
    LIBS.set_position(badan.MOVEMATRIX, 0, 0.1 + bounce, 0);

    // 5. Goyangan antena
    if (antena) {
        LIBS.set_I4(antena.MOVEMATRIX);
        LIBS.set_position(antena.MOVEMATRIX, 0, 0.3, -0.3);
        LIBS.rotateZ(antena.MOVEMATRIX, Math.sin(t * 3.5) * 0.15);
    }
}