import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid } from "../shared/bentuk.js";

// bom yang bisa dilempar sama Penggerak, terus detak, terus meledak
// model = Objek bom nya (misal buatBomb(GL) punya kevin)
//
// cara pakai di main.js:
//   var bom = new Bom(GL, buatBomb(GL));
//   masukin bom.tempat ke daftar objek, terus di animasi: bom.update(time)
//   lempar pake penggerak: gerak.lempar(bom, x, y, detik, sumbu)
//
// keadaan bom: "sembunyi" -> "terbang" -> "detak" -> "ledak" -> "sembunyi" lagi (bisa dilempar lagi)

var LAMA_LEDAK = 0.8;

// ledakan bentuk plus kayak di bomberman: bola kuning di tengah + 2 ellipsoid oranye panjang (x sama z)
function buatApi(GL) {
    var api = new Objek(GL);

    var lenganX = buatEllipsoid(3.2, 0.7, 0.7, 12, 24);
    var lenganZ = buatEllipsoid(0.7, 0.7, 3.2, 12, 24);
    var tengah = buatEllipsoid(1.1, 1.1, 1.1, 16, 24);
    api.addChild(new Objek(GL, lenganX.vertex, lenganX.faces, [1.0, 0.45, 0.05]));
    api.addChild(new Objek(GL, lenganZ.vertex, lenganZ.faces, [1.0, 0.45, 0.05]));
    api.addChild(new Objek(GL, tengah.vertex, tengah.faces, [1.0, 0.85, 0.2]));

    return api;
}

export class Bom {
    constructor(GL, model) {
        // tempat = posisi bom di arena, isi = pivot buat gedein / sembunyiin model bom nya
        this.tempat = new Objek(GL);
        this.isi = new Objek(GL);
        this.api = buatApi(GL);
        this.isi.addChild(model);
        this.tempat.addChild(this.isi);
        this.tempat.addChild(this.api);

        this.keadaan = "sembunyi";
        this.waktuLedak = 0;
        this.sembunyi();
    }

    // skala 0 = ga keliatan
    skala(objek, s) {
        LIBS.set_I4(objek.MOVEMATRIX);
        LIBS.scale(objek.MOVEMATRIX, s, s, s);
    }

    sembunyi() {
        this.keadaan = "sembunyi";
        this.skala(this.isi, 0);
        this.skala(this.api, 0);
    }

    // dipanggil penggerak tiap frame selama lemparan
    taruh(x, y, z) {
        this.keadaan = "terbang";
        this.skala(this.isi, 1);
        this.skala(this.api, 0);
        LIBS.set_I4(this.tempat.MOVEMATRIX);
        LIBS.set_position(this.tempat.MOVEMATRIX, x, y, z);
    }

    // dipanggil penggerak pas bom udah mendarat, meledak setelah sumbu detik
    mendarat(t, sumbu) {
        this.keadaan = "detak";
        this.waktuLedak = t + sumbu;
    }

    update(time) {
        var t = time / 1000;

        if (this.keadaan == "detak" && t >= this.waktuLedak) {
            this.keadaan = "ledak";
        }

        if (this.keadaan == "ledak") {
            // k = 0 sampai 1 selama ledakan
            var k = (t - this.waktuLedak) / LAMA_LEDAK;
            if (k >= 1) {
                this.sembunyi();
                return;
            }

            // bom nya ngembang dikit dulu terus ilang
            this.skala(this.isi, k < 0.2 ? 1 + k / 0.2 * 0.35 : 0);

            // api nya gede terus kecil lagi (setengah gelombang sin), agak naik dari lantai
            var s = Math.sin(k * Math.PI);
            this.skala(this.api, s);
            LIBS.set_position(this.api.MOVEMATRIX, 0, 0.7 * s, 0);
        }
    }
}
