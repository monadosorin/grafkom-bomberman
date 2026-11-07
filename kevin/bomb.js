import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import {
    buatEllipsoid,
    buatTabung,
    buatFrustum,
    buatParaboloid
} from "../shared/bentuk.js";

// Node yang diekspos untuk kontrol dan animasi
export var bombRoot, bombBody, bombCap, bombFuse, bombSpark, bombSparkCore;

// Helper aman jika LIBS.scale belum terdefinisi di libs.js
function scaleMatrix(m, sx, sy, sz) {
    if (typeof LIBS.scale === "function") {
        LIBS.scale(m, sx, sy, sz);
    } else {
        m[0] *= sx; m[1] *= sx; m[2] *= sx;
        m[4] *= sy; m[5] *= sy; m[6] *= sy;
        m[8] *= sz; m[9] *= sz; m[10] *= sz;
    }
}

export function buatBomb(GL) {
    // Palet Warna Bom Bomberman Klasik
    var warnaHitam    = [0.12, 0.12, 0.14];
    var warnaPutih    = [0.95, 0.95, 0.95];
    var warnaAbuMetal = [0.65, 0.65, 0.70];
    var warnaSumbu    = [0.82, 0.72, 0.52];
    var warnaApiLuar  = [1.00, 0.35, 0.05]; // Oranye api
    var warnaApiInti  = [1.00, 0.90, 0.10]; // Kuning terang

    // 1. Root Pivot Bom (Diletakkan di permukaan lantai y = 0)
    bombRoot = new Objek(GL);
    LIBS.set_position(bombRoot.MOVEMATRIX, 0, 0, 0);

    // 2. Bodi Utama Bom (Bola Hitam)
    // Jari-jari R = 0.45, posisi pusat di Y = 0.45 agar dasar bola pas menempel tanah (Y = 0)
    var geomBody = buatEllipsoid(0.45, 0.45, 0.45, 24, 24);
    bombBody = new Objek(GL, geomBody.vertex, geomBody.faces, warnaHitam);
    LIBS.set_position(bombBody.MOVEMATRIX, 0, 0.45, 0);
    bombRoot.addChild(bombBody);

    // 3. Cartoon Specular Highlight (Pantulan Cahaya Kartun)
    // Ellipsoid tipis putih menempel di sudut kiri atas depan bola
    var geomHighlight = buatEllipsoid(0.09, 0.14, 0.02, 16, 16);
    var highlight = new Objek(GL, geomHighlight.vertex, geomHighlight.faces, warnaPutih);
    LIBS.set_position(highlight.MOVEMATRIX, -0.18, 0.20, 0.38);
    LIBS.rotateZ(highlight.MOVEMATRIX, 0.35); // Sedikit miring mengikuti lengkungan bola
    bombBody.addChild(highlight);

    // 4. Tutup / Leher Bom (Metal Cap)
    // Tabung metal di kutub atas bola (Y = 0.42 dari pusat bola)
    var geomCap = buatTabung(0.13, 0.10, 20);
    bombCap = new Objek(GL, geomCap.vertex, geomCap.faces, warnaAbuMetal);
    LIBS.set_position(bombCap.MOVEMATRIX, 0, 0.42, 0);
    bombBody.addChild(bombCap);

    // 5. Sumbu Bom (Fuse Tali)
    // Frustum kecil agak melengkung ke samping-belakang
    var geomFuse = buatFrustum(0.025, 0.02, 0.18, 16, 16);
    bombFuse = new Objek(GL, geomFuse.vertex, geomFuse.faces, warnaSumbu);
    LIBS.set_position(bombFuse.MOVEMATRIX, 0, 0.08, 0);
    LIBS.rotateZ(bombFuse.MOVEMATRIX, -0.35); // Melengkung ke kanan
    LIBS.rotateX(bombFuse.MOVEMATRIX, -0.15); // Sedikit ke belakang
    bombCap.addChild(bombFuse);

    // 6. Percikan Api (Spark / Flame)
    // Lapisan Luar (Oranye)
    var geomSpark = buatParaboloid(0.08, 0.16, 0.08, 16, 16);
    bombSpark = new Objek(GL, geomSpark.vertex, geomSpark.faces, warnaApiLuar);
    LIBS.set_position(bombSpark.MOVEMATRIX, 0, 0.18, 0);
    bombFuse.addChild(bombSpark);

    // Inti Api Terang (Kuning)
    var geomSparkCore = buatEllipsoid(0.045, 0.06, 0.045, 12, 12);
    bombSparkCore = new Objek(GL, geomSparkCore.vertex, geomSparkCore.faces, warnaApiInti);
    LIBS.set_position(bombSparkCore.MOVEMATRIX, 0, 0.04, 0);
    bombSpark.addChild(bombSparkCore);

    return bombRoot;
}

/**
 * Loop animasi bom
 * @param {number} time - Timestamp dalam milidetik (performance.now())
 */
export function animasiBomb(time) {
    if (!bombRoot || !bombBody || !bombSpark) return;

    var t = time / 1000;

    // 1. Efek Denyut Ticking Bom (Squash & Stretch)
    // Denyut ritmis: saat melebar ke samping (XZ), tingginya (Y) sedikit memampat
    var pulseFreq = 6.0; // Frekuensi detak
    var pulseAmp = 0.07;
    var pulse = Math.sin(t * pulseFreq);

    var scaleXZ = 1.0 + pulse * pulseAmp;
    var scaleY  = 1.0 - pulse * (pulseAmp * 0.8);

    LIBS.set_I4(bombBody.MOVEMATRIX);
    // Naikkan Y dasar saat stretch agar dasar bom tetap menyentuh tanah
    var groundCompensation = 0.45 * scaleY;
    LIBS.set_position(bombBody.MOVEMATRIX, 0, groundCompensation, 0);
    scaleMatrix(bombBody.MOVEMATRIX, scaleXZ, scaleY, scaleXZ);

    // 2. Efek Kerlip & Rotasi Percikan Api (Spark Flicker)
    var sparkFlicker = 1.0 + Math.sin(t * 25.0) * 0.25;

    LIBS.set_I4(bombSpark.MOVEMATRIX);
    LIBS.set_position(bombSpark.MOVEMATRIX, 0, 0.18, 0);
    LIBS.rotateY(bombSpark.MOVEMATRIX, t * 12.0); // Berputar cepat
    scaleMatrix(bombSpark.MOVEMATRIX, sparkFlicker, sparkFlicker, sparkFlicker);
}