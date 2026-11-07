import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid } from "../shared/bentuk.js";
import { PETAK, petakDiblok } from "./arena.js";

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
// ledakannya kayak bomberman: api nyebar bentuk plus ngikutin petak, maksimal JANGKAUAN petak,
// berhenti kalau ketemu pilar / tembok. bomber yang petaknya kena api langsung ilang

var LAMA_LEDAK = 0.8;
var JANGKAUAN = 3;

// 4 arah api: [dx, dy] di peta, sama sudut rotateY biar lengan apinya ngadep ke situ
// rotateY(sudut) muter sumbu +x ke (cos, 0, -sin), jadi 90 derajat = ke atas peta (-z)
var ARAH = [
    [1, 0, 0],
    [-1, 0, Math.PI],
    [0, 1, Math.PI / 2],
    [0, -1, -Math.PI / 2]
];

export class Bom {
    constructor(GL, model) {
        // tempat = posisi bom di arena, isi = pivot buat gedein / sembunyiin model bom nya
        this.tempat = new Objek(GL);
        this.isi = new Objek(GL);
        this.isi.addChild(model);
        this.tempat.addChild(this.isi);

        // api: bola kuning di tengah + 4 lengan oranye, panjang lengannya diatur pas meledak
        this.api = new Objek(GL);
        this.tempat.addChild(this.api);

        var r = 0.45 * PETAK;
        var tengah = buatEllipsoid(r, r, r, 16, 24);
        this.api.addChild(new Objek(GL, tengah.vertex, tengah.faces, [1.0, 0.85, 0.2]));

        // tiap lengan = beberapa gumpalan api, 1 gumpalan per petak (kayak api bomberman)
        // gumpalannya agak lebih panjang dari 1 petak biar nyambung sama sebelahnya
        // nanti yang dipake cuma sebanyak jangkauan apinya, sisanya disembunyiin (skala 0)
        var tebal = 0.3 * PETAK;
        var gumpal = buatEllipsoid(0.6 * PETAK, tebal, tebal, 12, 24);
        this.lengan = [];
        for (var a of ARAH) {
            var pivot = new Objek(GL);
            LIBS.rotateY(pivot.MOVEMATRIX, a[2]);
            this.api.addChild(pivot);

            var daftar = [];
            for (var n = 1; n <= JANGKAUAN; n++) {
                var g = new Objek(GL, gumpal.vertex, gumpal.faces, [1.0, 0.45, 0.05]);
                pivot.addChild(g);
                daftar.push(g);
            }
            this.lengan.push(daftar);
        }

        this.korban = [];
        this.keadaan = "sembunyi";
        this.waktuLedak = 0;
        this.petak = [0, 0];
        this.panjang = [0, 0, 0, 0];
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

        // itung api nyampe berapa petak ke tiap arah, berhenti di pilar / tembok
        for (var i = 0; i < ARAH.length; i++) {
            var n = 0;
            while (n < JANGKAUAN && !petakDiblok(x + ARAH[i][0] * (n + 1), y + ARAH[i][1] * (n + 1))) n++;
            this.panjang[i] = n;

            // gumpalan ke-j ditaruh di petak ke-j dari bom, cuma yang masih kena api yang keliatan
            for (var j = 0; j < JANGKAUAN; j++) {
                var g = this.lengan[i][j];
                this.skala(g, j < n ? 1 : 0);
                LIBS.set_position(g.MOVEMATRIX, (j + 1) * PETAK, 0, 0);
            }
        }
    }

    // true kalau petak (x, y) kena api
    kenaApi(x, y) {
        var bx = this.petak[0], by = this.petak[1];
        if (x == bx && y == by) return true;
        for (var i = 0; i < ARAH.length; i++) {
            for (var n = 1; n <= this.panjang[i]; n++) {
                if (x == bx + ARAH[i][0] * n && y == by + ARAH[i][1] * n) return true;
            }
        }
        return false;
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
