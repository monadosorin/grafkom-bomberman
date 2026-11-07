import { mulaiScene } from "./shared/engine.js";
import { Objek } from "./shared/objek.js";
import { buatMagnetBomber, animasiMagnetBomber } from "./fabio/magnetBomber.js";
import { buatWhiteBomber, animasiWhiteBomber } from "./kevin/whiteBomber.js";
import { buatGolemBomber, animasiGolemBomber } from "./nick/golemBomber.js";
import { buatBomb, animasiBomb } from "./kevin/bomb.js"; //import bomb
import { buatArena, labelPetak } from "./arena/arena.js";
import { Penggerak } from "./arena/gerak.js";

mulaiScene(function (GL) {
    var arena = buatArena(GL);

    // tiap karakter punya tempat sendiri, gerakan karakter relatif ke tempatnya
    var tempatKevin = new Objek(GL);
    var tempatFabio = new Objek(GL);
    var tempatNick = new Objek(GL);

    tempatKevin.addChild(buatWhiteBomber(GL));
    tempatFabio.addChild(buatMagnetBomber(GL));
    tempatNick.addChild(buatGolemBomber(GL));

    // ===== posisi awal sama gerakan tiap bomber, atur di sini =====
    // koordinat petak (x, y): x = -6 .. 6 (kiri ke kanan), y = -4 .. 4 (depan ke belakang), (0, 0) = tengah
    // pencet G di browser buat liat koordinat tiap petak, yang merah itu pilar (ga bisa diinjek)
    //   jalanKe(x, y, detik) = jalan ke petak (x, y)
    //   diam(detik)          = diem di tempat
    //   hadap(derajat, detik) = muter, 0 = depan, 90 = kanan, 180 = belakang, -90 = kiri
    //   ulang = true         = kalau udah habis ulang dari awal (jadi akhirnya harus balik ke petak awal)

    var gerakFabio = new Penggerak(tempatFabio, -2, 0);
    gerakFabio.jalanKe(-2, 2, 1.5).jalanKe(-4, 2, 1.5).jalanKe(-4, 0, 1.5).jalanKe(-2, 0, 1.5).diam(1);
    gerakFabio.ulang = true;

    var gerakKevin = new Penggerak(tempatKevin, 0, 0);
    gerakKevin.diam(1).jalanKe(0, -3, 2.5).diam(0.5).jalanKe(0, 0, 2.5);
    gerakKevin.ulang = true;

    // golem 1.5x lebih gede dari yang lain (parameter terakhir = skala)
    var gerakNick = new Penggerak(tempatNick, 2, 0, 1.5);
    gerakNick.diam(2).jalanKe(2, 2, 2.5).diam(1).jalanKe(2, 0, 2.5);
    gerakNick.ulang = true;

    return {
        objek: [arena, tempatKevin, tempatFabio, tempatNick],
        animasi: function (time) {
            gerakFabio.update(time);
            gerakKevin.update(time);
            gerakNick.update(time);

            // gerakX.jalan = lagi jalan apa diem, dikasih ke animasi biar bisa ganti gaya
            animasiWhiteBomber(time);
            animasiMagnetBomber(time, gerakFabio.jalan);
            animasiGolemBomber(time);
        },
        // arena udah punya lantai sendiri
        lantai: false,
        kamera: "bebas",
        label: labelPetak()
    };
}, 33);
