import { mulaiScene } from "./shared/engine.js";
import { Objek } from "./shared/objek.js";
import { LIBS } from "./shared/libs.js";
import { buatMagnetBomber, animasiMagnetBomber } from "./fabio/magnetBomber.js";
import { buatWhiteBomber, animasiWhiteBomber } from "./kevin/whiteBomber.js";
import { buatGolemBomber, animasiGolemBomber } from "./nick/golemBomber.js";
import { buatArena } from "./arena/arena.js";

mulaiScene(function (GL) {
    var arena = buatArena(GL);

    // tiap karakter punya tempat sendiri, gerakan karakter relatif ke tempatnya
    var tempatKevin = new Objek(GL);
    var tempatFabio = new Objek(GL);
    var tempatNick = new Objek(GL);

    LIBS.set_position(tempatFabio.MOVEMATRIX, -3, 0, 0);
    LIBS.set_position(tempatNick.MOVEMATRIX, 3, 0, 0);

    tempatKevin.addChild(buatWhiteBomber(GL));
    tempatFabio.addChild(buatMagnetBomber(GL));
    tempatNick.addChild(buatGolemBomber(GL));

    return {
        objek: [arena, tempatKevin, tempatFabio, tempatNick],
        animasi: function (time) {
            animasiWhiteBomber(time);
            animasiMagnetBomber(time);
            animasiGolemBomber(time);
        },
        // arena udah punya lantai sendiri
        lantai: false
    };
}, 16);
