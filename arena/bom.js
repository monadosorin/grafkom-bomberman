import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid } from "../shared/bentuk.js";
import { PETAK } from "./arena.js";

// bom yang bisa dilempar sama Penggerak, terus detak, terus meledak
// model = Objek bom nya (misal buatBomb(GL) punya kevin)
//
// cara pakai di main.js:
//   var bom = new Bom(GL, buatBomb(GL));
//   bom.korban = [gerakA, gerakB];   // penggerak bomber yang bisa kena ledakan
//   masukin bom.tempat ke daftar objek, terus di animasi: bom.update(time)
//   lempar pake penggerak: gerak.lempar(bom, x, y, detik, sumbu)
//
// keadaan bom: "sembunyi" -> "terbang" -> "detak" -> "ledak" -> "sembunyi" lagi (bisa dilempar lagi)
//
// ledakannya bentuk plus, lengannya nyampe JANGKAUAN petak ke tiap arah
// bomber yang petaknya sebaris / sekolom sama bom dan masih dalem jangkauan langsung ilang

var LAMA_LEDAK = 0.8;
var JANGKAUAN = 3;

// ledakan bentuk plus kayak di bomberman: bola kuning di tengah + 2 ellipsoid oranye panjang (x sama z)
// panjang lengannya ngikutin JANGKAUAN biar yang keliatan kena api = yang beneran kena
function buatApi(GL) {
    var api = new Objek(GL);

    var panjang = (JANGKAUAN + 0.5) * PETAK, tebal = 0.3 * PETAK, tengahR = 0.45 * PETAK;
    var lenganX = buatEllipsoid(panjang, tebal, tebal, 12, 32);
    var lenganZ = buatEllipsoid(tebal, tebal, panjang, 12, 32);
    var tengah = buatEllipsoid(tengahR, tengahR, tengahR, 16, 24);
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

        this.korban = [];
        this.keadaan = "sembunyi";
        this.waktuLedak = 0;
        this.petak = [0, 0];
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

    // dipanggil penggerak pas bom udah mendarat di petak (x, y), meledak setelah sumbu detik
    mendarat(t, sumbu, x, y) {
        this.keadaan = "detak";
        this.waktuLedak = t + sumbu;
        this.petak = [x, y];
    }

    // true kalau petak (x, y) kena api: sebaris atau sekolom sama bom, jaraknya maksimal JANGKAUAN
    kenaApi(x, y) {
        var dx = Math.abs(x - this.petak[0]);
        var dy = Math.abs(y - this.petak[1]);
        return (dy == 0 && dx <= JANGKAUAN) || (dx == 0 && dy <= JANGKAUAN);
    }

    update(time) {
        var t = time / 1000;

        if (this.keadaan == "detak" && t >= this.waktuLedak) {
            this.keadaan = "ledak";

            // bomber yang petaknya kena api langsung ilang
            for (var g of this.korban) {
                if (this.kenaApi(Math.round(g.x), Math.round(g.y))) g.hilang = true;
            }
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
            LIBS.set_position(this.api.MOVEMATRIX, 0, 0.3 * PETAK * s, 0);
        }
    }
}
