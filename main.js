import { mulaiScene } from "./shared/engine.js";
import { Objek } from "./shared/objek.js";
import { buatMagnetBomber, animasiMagnetBomber } from "./fabio/magnetBomber.js";
import { buatWhiteBomber, animasiWhiteBomber } from "./kevin/whiteBomber.js";
import { buatGolemBomber, animasiGolemBomber } from "./nick/golemBomber.js";
import { buatBomb, animasiBomb } from "./kevin/bomb.js"; //import bomb
import { buatArena, labelPetak } from "./arena/arena.js";
import { Penggerak } from "./arena/gerak.js";
import { Bom } from "./arena/bom.js";

mulaiScene(function (GL) {
    var arena = buatArena(GL);

    // tiap karakter punya tempat sendiri, gerakan karakter relatif ke tempatnya
    var tempatKevin = new Objek(GL);
    var tempatFabio = new Objek(GL);
    var tempatNick = new Objek(GL);

    tempatKevin.addChild(buatWhiteBomber(GL));
    tempatFabio.addChild(buatMagnetBomber(GL));
    tempatNick.addChild(buatGolemBomber(GL));

    // bom punya kevin, dibungkus Bom biar bisa dilempar, detak, terus meledak
    var bom = new Bom(GL, buatBomb(GL));

    // ===== posisi awal sama gerakan tiap bomber, atur di sini =====
    // koordinat petak (x, y): x = -6 .. 6 (kiri ke kanan), y = -4 .. 4 (bawah/depan ke atas/belakang), (0, 0) = tengah
    // pencet G di browser buat liat koordinat tiap petak, yang merah itu pilar (ga bisa diinjek)
    //   new Penggerak(tempat, x, y, skala, arah) = posisi awal
    //   jalanKe(x, y, detik)   = jalan ke petak (x, y)
    //   diam(detik)            = diem di tempat
    //   hadap(derajat, detik)  = muter, 0 = bawah (depan), 90 = kanan, 180 = atas (belakang), -90 = kiri
    //   sampai(detik)          = tunggu sampe detik ke-sekian dari awal, biar urutan antar bomber pas
    //   lempar(bom, x, y, detik, sumbu) = lempar bom ke petak (x, y), meledak sumbu detik abis mendarat
    //                            api nya nyebar 3 petak bentuk plus, bomber yang kena langsung ilang
    //   ulang = true           = kalau udah habis ulang dari awal (jadi akhirnya harus balik ke petak awal)
    //
    // jalan kira2 1.6 petak per detik, golem 1.3 (soalnya gede)

    var ATAS = 180, BAWAH = 0, KANAN = 90, KIRI = -90;

    // posisi awal
    var gerakKevin = new Penggerak(tempatKevin, -6, 2, 1, ATAS);    // white bomber
    var gerakFabio = new Penggerak(tempatFabio, -3, 4, 1, KIRI);    // magnet bomber
    var gerakNick = new Penggerak(tempatNick, -2, -4, 1.5, KIRI);   // golem bomber, 1.5x lebih gede

    // bomber yang bisa kena ledakan bom, kalau kena langsung ilang
    bom.korban = [gerakKevin, gerakFabio, gerakNick];

    // 1. (0 - 2 detik) kamera ke white bomber, diatur manual

    // 2. white ke (-6, 4) terus ngadep kanan
    gerakKevin.sampai(2).jalanKe(-6, 4, 1.3).hadap(KANAN, 0.3);

    // 3. white ngadep bawah terus jalan ke (-6, 1)
    gerakKevin.diam(0.3).hadap(BAWAH, 0.4).jalanKe(-6, 1, 1.9);

    // 4. golem ke (-6, -4) terus ngadep atas
    gerakNick.sampai(6.5).jalanKe(-6, -4, 3.1).hadap(ATAS, 0.4);

    // 5. white lempar bom ke (-6, -3)
    gerakKevin.sampai(10.3).lempar(bom, -6, -3, 1.4, 2);

    // 6. semua ngadep kanan terus jalan bareng
    //    white lewat (-6, 0) dulu soalnya (-5, 1) itu pilar
    gerakKevin.sampai(12).hadap(KANAN, 0.3).jalanKe(-6, 0, 0.6).jalanKe(5, 0, 6.9);
    gerakFabio.sampai(12).hadap(KANAN, 0.3).jalanKe(5, 4, 5);
    gerakNick.sampai(12).hadap(KANAN, 0.3).jalanKe(5, -4, 8.5);

    // 7. white ke (6, 0), ngadep atas, lempar bom ke (6, 4)
    gerakKevin.sampai(21).jalanKe(6, 0, 0.6).hadap(ATAS, 0.3).diam(0.2).lempar(bom, 6, 4, 1.4, 3);

    // 8. (sekitar detik 23.5 - 27.3) kamera ke magnet bomber terus pergi sebelum meledak, diatur manual

    // 9. white ngadep bawah, lempar bom ke (6, -4)
    gerakKevin.sampai(27.8).hadap(BAWAH, 0.4).diam(0.2).lempar(bom, 6, -4, 1.4, 3);

    // 10. golem ngadep kanan terus ke (3, -4), kamera diatur manual
    gerakNick.sampai(30).hadap(KANAN, 0.3).jalanKe(3, -4, 1.55);

    // 11. white ngadep kiri, jalan ke (0, 0), terus ngadep bawah
    gerakKevin.sampai(39.5).hadap(KIRI, 0.4).jalanKe(0, 0, 3.75).hadap(BAWAH, 0.4);

    // 12. selesai (sekitar detik 44), magnet sama golem udah ilang kena ledakan, white sisa sendiri

    return {
        objek: [arena, tempatKevin, tempatFabio, tempatNick, bom.tempat],
        animasi: function (time) {
            gerakFabio.update(time);
            gerakKevin.update(time);
            gerakNick.update(time);
            bom.update(time);

            // gerakX.jalan = lagi jalan apa diem, gerakX.lagiLempar = lagi ngangkat bom
            // dikasih ke animasi biar bisa ganti gaya
            animasiWhiteBomber(time, gerakKevin.jalan, gerakKevin.lagiLempar);
            animasiMagnetBomber(time, gerakFabio.jalan);
            animasiGolemBomber(time);
            animasiBomb(time);
        },
        // arena udah punya lantai sendiri
        lantai: false,
        kamera: "bebas",
        label: labelPetak()
    };
}, 62);
