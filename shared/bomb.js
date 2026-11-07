import { Objek } from "./objek";
import { LIBS } from "./libs";
import { buatEllipsoid } from "./bentuk";

export var root;

export function buatBomb(GL){
    var warnaHitam=[0,0,0];

    root = new Objek(GL);
    LIBS.set_position(root.MOVEMATRIX, 0, 1, 0);

    var bombBase = buatEllipsoid(0.2, 0.2, 0.2, 20, 20);
    var bB = new Objek(GL, bombBase.vertex, bombBase.faces, warnaHitam);
    LIBS.set_position(bB.MOVEMATRIX, 0,0,0);
    root.addChild(bombBase);

    return root;
}