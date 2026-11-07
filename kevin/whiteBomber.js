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

// contoh doang, nanti diganti sama karakter asli

var badan, pinggulKiri, pinggulKanan;

export function buatWhiteBomber(GL) {
    var warnaMerah = [0.9, 0.3, 0.45];
    var warnaPutih = [1, 1, 1];
    var warnaBiru = [0.2, 0.2, 0.9];
    var warnaHitam = [0, 0, 0];
    var warnaKulit = [0.9, 0.7, 0.5];

    // root di tanah (y = 0), kosong
    var root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 1, 0);

    //-------------------------------------TORSO----------------------------------------------

    //torso biru
    var torsoBiru = buatOvoid(0.3, 0.4, 0.3, 0.28, 20, 20);
    torsoBiru = new Objek(GL, torsoBiru.vertex, torsoBiru.faces, warnaBiru);
    LIBS.set_position(torsoBiru.MOVEMATRIX, 0, 0.1, 0);
    root.addChild(torsoBiru);

    //sabuk hitam
    var sh = buatTabung(0.32, 0.1, 20);
    var sabukHitam = new Objek(GL, sh.vertex, sh.faces, warnaHitam);
    LIBS.set_position(sabukHitam.MOVEMATRIX, 0, -0.2, 0);
    torsoBiru.addChild(sabukHitam);

    //belt buckle kuning
    var bb = buatKotak(0.15, 0.1, 0.02);
    var beltBuckle = new Objek(GL, bb.vertex, bb.faces, [0.9, 0.9, 0]);
    LIBS.set_position(beltBuckle.MOVEMATRIX, 0, 0.05, 0.33);
    sabukHitam.addChild(beltBuckle);

    //belt buckle hitam dalam
    var bb2 = buatKotak(0.1, 0.05, 0.02);
    var beltBuckleHitam = new Objek(GL, bb2.vertex, bb2.faces, warnaHitam);
    LIBS.set_position(beltBuckleHitam.MOVEMATRIX, 0, 0.05, 0.331);
    sabukHitam.addChild(beltBuckleHitam);

    //-------------------------------------KEPALA----------------------------------------------

    //kepala = pivot buat kepala, ga ada bentuknya
    var k = buatEllipsoid(0, 0, 0, 0, 20);
    var kepala = new Objek(GL, k.vertex, k.faces, warnaPutih);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.8, 0);
    torsoBiru.addChild(kepala);

    //helm
    var h = buatKapsul(0.454, 0.28, 0.35, 0.2, 20, 20);
    var helm = new Objek(GL, h.vertex, h.faces, warnaPutih);
    LIBS.set_position(helm.MOVEMATRIX, 0, 0, -0.06);
    kepala.addChild(helm);

    //lisHitam
    var l = buatHiperboloid2(1.3, 2, 1, 0.3, 20, 20);
    var lisHitam = new Objek(GL, l.vertex, l.faces, warnaHitam);
    LIBS.set_position(lisHitam.MOVEMATRIX, 0, 0, -1.8);
    LIBS.rotateX(lisHitam.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(lisHitam);

    //muka
    var m = buatHiperboloid2(1.3, 1.9, 1, 0.3, 20, 20);
    var muka = new Objek(GL, m.vertex, m.faces, warnaKulit);
    LIBS.set_position(muka.MOVEMATRIX, 0, 0, 2.25);
    LIBS.rotateX(muka.MOVEMATRIX, -Math.PI / 2);
    kepala.addChild(muka);

    //mata
    var ma = buatLingkaran(0.03, 0.2, 20);
    var mataKiri = new Objek(GL, ma.vertex, ma.faces, warnaHitam);
    var mataKanan = new Objek(GL, ma.vertex, ma.faces, warnaHitam);
    LIBS.set_position(mataKiri.MOVEMATRIX, -0.15, 0, 0.35);
    LIBS.set_position(mataKanan.MOVEMATRIX, 0.15, 0, 0.35);
    LIBS.rotateX(mataKiri.MOVEMATRIX, Math.PI / 2);
    LIBS.rotateX(mataKanan.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(mataKiri);
    kepala.addChild(mataKanan);

    //helmTorus dan covernya
    var ht = buatTorus(0.43, 0.34, 0.07, 0.3, 20, 20);
    var helmTorus = new Objek(GL, ht.vertex, ht.faces, warnaPutih);
    LIBS.set_position(helmTorus.MOVEMATRIX, 0, 0, 0.05);
    LIBS.rotateX(helmTorus.MOVEMATRIX, Math.PI / 2);
    kepala.addChild(helmTorus);

    //frustum ke bola dari helm
    var tk = buatFrustum(0.03, 0.04, 0.3, 20, 20);
    var frustumKepala = new Objek(GL, tk.vertex, tk.faces, warnaPutih);
    LIBS.set_position(frustumKepala.MOVEMATRIX, 0, 0.3, -0.3);
    LIBS.rotateX(frustumKepala.MOVEMATRIX, -Math.PI / 4);
    kepala.addChild(frustumKepala);

    //bola kepala
    var bk = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var bolaKepala = new Objek(GL, bk.vertex, bk.faces, warnaMerah);
    LIBS.set_position(bolaKepala.MOVEMATRIX, 0, 0.5, -0.5);
    kepala.addChild(bolaKepala);

    //-------------------------------------TANGAN----------------------------------------------

    //tangan
    var tangan = buatFrustum(0.03, 0.1, 0.7, 20, 20);
    var tanganKiri = new Objek(GL, tangan.vertex, tangan.faces, warnaPutih);
    var tanganKanan = new Objek(GL, tangan.vertex, tangan.faces, warnaPutih);
    LIBS.set_position(tanganKiri.MOVEMATRIX, 0, 0.32, 0);
    LIBS.set_position(tanganKanan.MOVEMATRIX, 0, 0.32, 0);
    LIBS.rotateZ(tanganKiri.MOVEMATRIX, Math.PI / 2);
    LIBS.rotateZ(tanganKanan.MOVEMATRIX, -Math.PI / 2);
    torsoBiru.addChild(tanganKiri);
    torsoBiru.addChild(tanganKanan);

    //bola tangan
    var bolaTangan = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var bolaTanganKiri = new Objek(GL, bolaTangan.vertex, bolaTangan.faces, warnaMerah);
    var bolaTanganKanan = new Objek(GL, bolaTangan.vertex, bolaTangan.faces, warnaMerah);
    LIBS.set_position(bolaTanganKiri.MOVEMATRIX, 0, 0.8, 0);
    LIBS.set_position(bolaTanganKanan.MOVEMATRIX, 0, 0.8, 0);
    tanganKiri.addChild(bolaTanganKiri);
    tanganKanan.addChild(bolaTanganKanan);

    //-------------------------------------KAKI----------------------------------------------

    // pinggul = pivot buat kaki, ga ada bentuknya
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.2, -0.4, 0);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.2, -0.4, 0);
    torsoBiru.addChild(pinggulKiri);
    torsoBiru.addChild(pinggulKanan);

    //legs
    var kk = buatFrustum(0.05, 0.12, 0.8, 20, 20);
    var kakiKiri = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    var kakiKanan = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    LIBS.set_position(kakiKiri.MOVEMATRIX, 0.04, 0.1, 0);
    LIBS.set_position(kakiKanan.MOVEMATRIX, -0.04, 0.1, 0);
    LIBS.rotateZ(kakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateZ(kakiKanan.MOVEMATRIX, Math.PI);
    pinggulKiri.addChild(kakiKiri);
    pinggulKanan.addChild(kakiKanan);

    //foot (ball + paraboloid)
    var bolaKaki = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var ujungKaki = buatParaboloid(0.18, 0.4, 0.18, 20, 20);
    var ujungKakiKiri = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, warnaMerah);
    var ujungKakiKanan = new Objek(GL, ujungKaki.vertex, ujungKaki.faces, warnaMerah);
    var bolaKakiKiri = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, warnaMerah);
    var bolaKakiKanan = new Objek(GL, bolaKaki.vertex, bolaKaki.faces, warnaMerah);
    LIBS.set_position(bolaKakiKiri.MOVEMATRIX, 0, 0.7, 0);
    LIBS.set_position(bolaKakiKanan.MOVEMATRIX, 0, 0.7, 0);
    LIBS.set_position(ujungKakiKiri.MOVEMATRIX, 0, 0, 0.5);
    LIBS.set_position(ujungKakiKanan.MOVEMATRIX, 0, 0, 0.5);
    LIBS.rotateX(ujungKakiKiri.MOVEMATRIX, -Math.PI / 2);
    LIBS.rotateX(ujungKakiKanan.MOVEMATRIX, -Math.PI / 2);
    bolaKakiKiri.addChild(ujungKakiKiri);
    bolaKakiKanan.addChild(ujungKakiKanan);
    kakiKiri.addChild(bolaKakiKiri);
    kakiKanan.addChild(bolaKakiKanan);

    return root;
}

// animasi nanti
export function animasiWhiteBomber(time) {
}
