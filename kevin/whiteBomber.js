import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid } from "../shared/bentuk.js";
import { buatOvoid } from "../shared/bentuk.js";
import { buatKerucut } from "../shared/bentuk.js";
import {buatFrustum} from "../shared/bentuk.js";

// contoh doang, nanti diganti sama karakter asli

var badan, pinggulKiri, pinggulKanan;

export function buatWhiteBomber(GL) {
    var warnaMerah = [0.9, 0.3, 0.45];
    var warnaPutih = [1, 1, 1];
    var warnaBiru = [0.2, 0.2, 0.9];

    // root di tanah (y = 0), kosong
    var root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 1, 0);

    //torso biru
    var torsoBiru = buatOvoid(0.3, 0.4, 0.3, 0.28, 20, 20);
    torsoBiru = new Objek(GL, torsoBiru.vertex, torsoBiru.faces, warnaBiru);
    LIBS.set_position(torsoBiru.MOVEMATRIX, 0, 0.1, 0);
    root.addChild(torsoBiru);

    //kepala
    var k = buatEllipsoid(0.45, 0.4, 0.45, 20, 20);
    var kepala = new Objek(GL, k.vertex, k.faces, warnaPutih);
    LIBS.set_position(kepala.MOVEMATRIX, 0, 0.8, 0);
    torsoBiru.addChild(kepala);

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

    // pinggul = pivot buat kaki, ga ada bentuknya
    pinggulKiri = new Objek(GL);
    pinggulKanan = new Objek(GL);
    LIBS.set_position(pinggulKiri.MOVEMATRIX, -0.2, -0.4, 0);
    LIBS.set_position(pinggulKanan.MOVEMATRIX, 0.2, -0.4, 0);
    torsoBiru.addChild(pinggulKiri);
    torsoBiru.addChild(pinggulKanan);

    //legs
    var kk = buatFrustum(0.05, 0.12, 1.2, 20, 20);
    var kakiKiri = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    var kakiKanan = new Objek(GL, kk.vertex, kk.faces, warnaPutih);
    LIBS.set_position(kakiKiri.MOVEMATRIX, 0.04, 0.1, 0);
    LIBS.set_position(kakiKanan.MOVEMATRIX, -0.04, 0.1, 0);
    LIBS.rotateZ(kakiKiri.MOVEMATRIX, Math.PI);
    LIBS.rotateZ(kakiKanan.MOVEMATRIX, Math.PI);
    pinggulKiri.addChild(kakiKiri);
    pinggulKanan.addChild(kakiKanan);

    return root;
}

// animasi nanti
export function animasiWhiteBomber(time) {
}
