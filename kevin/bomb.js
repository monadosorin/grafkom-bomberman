import { Objek } from "../shared/objek.js";
import { LIBS } from "../shared/libs.js";
import { buatEllipsoid } from "../shared/bentuk.js";

export var root, bombBase;

export function buatBomb(GL){
    var warnaHitam=[0,0,0];

    root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 0, 0);

    var bombBase = buatEllipsoid(1, 1, 1, 20, 20);
    var bB = new Objek(GL, bombBase.vertex, bombBase.faces, warnaHitam);
    LIBS.set_position(bB.MOVEMATRIX, 0, 0, 0);
    root.addChild(bombBase);

    return root;
}

export function animasiBomb(time) {
    
}