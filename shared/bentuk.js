// semua fungsi return { vertex, faces }, tinggal dimasukin ke new Objek(...)
// y ke atas, jadi rumus yang z di tabel quadric dipindah ke y

// faces buat grid (baris x sector), dipake hampir semua bentuk
function facesGrid(baris, sector) {
    var faces = [];
    for (var i = 0; i < baris; i++) {
        for (var j = 0; j < sector; j++) {
            var p1 = i * (sector + 1) + j;
            var p2 = p1 + sector + 1;
            faces.push(p1, p2, p1 + 1);
            faces.push(p1 + 1, p2, p2 + 1);
        }
    }
    return faces;
}

// ellipsoid
// rx = jari2 kiri kanan, ry = atas bawah, rz = depan belakang
export function buatEllipsoid(rx, ry, rz, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = -Math.PI / 2 + Math.PI * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.cos(v) * Math.cos(u),
                ry * Math.sin(v),
                rz * Math.cos(v) * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// ellipsoid modifikasi (kapsul): dibelah di tengah, atas digeser naik, bawah digeser turun
// tinggi = panjang bagian lurus di tengah, tinggi total = 2 * ry + tinggi
// stack harus genap
export function buatKapsul(rx, ry, rz, tinggi, stack, sector) {
    var vertex = [];

    // ring v = 0 dibikin 2 kali (sekali turun, sekali naik) biar tengahnya lurus
    for (var i = 0; i <= stack + 1; i++) {
        var v, geser;
        if (i <= stack / 2) {
            v = -Math.PI / 2 + Math.PI * i / stack;
            geser = -tinggi / 2;
        } else {
            v = -Math.PI / 2 + Math.PI * (i - 1) / stack;
            geser = tinggi / 2;
        }

        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.cos(v) * Math.cos(u),
                ry * Math.sin(v) + geser,
                rz * Math.cos(v) * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack + 1, sector) };
}

// tabung (cylinder) tanpa tutup, dari y = 0 sampai y = tinggi
export function buatTabung(r, tinggi, sector) {
    var vertex = [];

    for (var y of [0, tinggi]) {
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(r * Math.cos(u), y, r * Math.sin(u));
        }
    }

    return { vertex: vertex, faces: facesGrid(1, sector) };
}

// elliptic cone, ujung lancipnya di (0,0,0), alasnya di y = ry
// v dari 0 sampai 1, jadi alasnya jari2 rx dan rz
export function buatKerucut(rx, ry, rz, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * v * Math.cos(u),
                ry * v,
                rz * v * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// hiperboloid 1 sisi (kayak jam pasir), v dari -vMax sampai vMax
// pinggang paling kecilnya di y = 0 dengan jari2 rx dan rz
export function buatHiperboloid1(rx, ry, rz, vMax, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = -vMax + 2 * vMax * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx / Math.cos(v) * Math.cos(u),
                ry * Math.tan(v),
                rz / Math.cos(v) * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// hiperboloid 2 sisi, cuma dipake 1 sisi (sheet 1), bentuknya mangkok
// v dari 0 sampai vMax, makin gede vMax makin lebar & lancip mangkoknya
// dasar mangkok di y = ry, pinggirnya di y = ry / cos(vMax)
export function buatHiperboloid2(rx, ry, rz, vMax, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = vMax * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * Math.tan(v) * Math.cos(u),
                ry / Math.cos(v),
                rz * Math.tan(v) * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// elliptic paraboloid (mangkok), dasarnya di (0,0,0)
// v dari 0 sampai 1, jadi pinggirnya di y = ry dengan jari2 rx dan rz
export function buatParaboloid(rx, ry, rz, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                rx * v * Math.cos(u),
                ry * v * v,
                rz * v * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// torus, Rx dan Rz = jari2 lingkaran besar
// rTebal = tebal tabungnya ke samping, rTinggi = tinggi tabungnya
// kalau rTinggi > rTebal tabungnya jadi pipih kayak pita
export function buatTorus(Rx, Rz, rTebal, rTinggi, stack, sector) {
    var vertex = [];

    for (var i = 0; i <= stack; i++) {
        var v = -Math.PI + 2 * Math.PI * i / stack;
        for (var j = 0; j <= sector; j++) {
            var u = -Math.PI + 2 * Math.PI * j / sector;
            vertex.push(
                (Rx + rTebal * Math.cos(v)) * Math.cos(u),
                rTinggi * Math.sin(v),
                (Rz + rTebal * Math.cos(v)) * Math.sin(u)
            );
        }
    }

    return { vertex: vertex, faces: facesGrid(stack, sector) };
}

// lingkaran (elips) datar di bidang xz, titik tengah + titik2 di pinggir
export function buatLingkaran(rx, rz, sector) {
    var vertex = [0, 0, 0];
    var faces = [];

    for (var j = 0; j <= sector; j++) {
        var u = -Math.PI + 2 * Math.PI * j / sector;
        vertex.push(rx * Math.cos(u), 0, rz * Math.sin(u));
    }

    for (var j = 0; j < sector; j++) {
        faces.push(0, j + 1, j + 2);
    }

    return { vertex: vertex, faces: faces };
}

// kotak, px py pz = panjang di sumbu x y z
// tiap sisi punya 4 vertex sendiri biar sudutnya tajam
export function buatKotak(px, py, pz) {
    var x = px / 2, y = py / 2, z = pz / 2;
    var vertex = [
        -x, -y, z, x, -y, z, x, y, z, -x, y, z,         // depan
        -x, -y, -z, x, -y, -z, x, y, -z, -x, y, -z,     // belakang
        -x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z,     // kiri
        x, -y, -z, x, -y, z, x, y, z, x, y, -z,         // kanan
        -x, y, -z, x, y, -z, x, y, z, -x, y, z,         // atas
        -x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z      // bawah
    ];

    var faces = [];
    for (var i = 0; i < 6; i++) {
        var p = i * 4;
        faces.push(p, p + 1, p + 2, p, p + 2, p + 3);
    }

    return { vertex: vertex, faces: faces };
}

// b-spline dari materi kelas, controlPoint = [x, y, x, y, ...]
// return titik2 kurvanya [x, y, x, y, ...] sebanyak m titik
export function generateBSpline(controlPoint, m, degree) {
    var curves = [];
    var knotVector = [];
    var n = controlPoint.length / 2;

    for (var i = 0; i < n + degree + 1; i++) {
        if (i < degree + 1) knotVector.push(0);
        else if (i >= n) knotVector.push(n - degree);
        else knotVector.push(i - degree);
    }

    var basisFunc = function (i, j, t) {
        if (j == 0) {
            if (t >= knotVector[n] && i === n - 1) return 1;
            return (knotVector[i] <= t && t < knotVector[i + 1]) ? 1 : 0;
        }
        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];

        var term1 = 0, term2 = 0;
        if (den1 != 0 && !isNaN(den1)) {
            term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
        }
        if (den2 != 0 && !isNaN(den2)) {
            term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
        }
        return term1 + term2;
    };

    for (var t = 0; t < m; t++) {
        var x = 0, y = 0;
        var u = (t / (m - 1) * (knotVector[n] - knotVector[degree])) + knotVector[degree];
        for (var key = 0; key < n; key++) {
            var C = basisFunc(key, degree, u);
            x += (controlPoint[key * 2] * C);
            y += (controlPoint[key * 2 + 1] * C);
        }
        curves.push(x);
        curves.push(y);
    }
    return curves;
}
