import { LIBS } from "./libs.js";
import { Objek } from "./objek.js";

// buatScene(GL) harus return { objek: [...], animasi: function (time) {...} }
// tambahan (boleh ga dipake):
//   lantai: false      -> ga pake lantai abu2 bawaan
//   kamera: "bebas"    -> kamera bebas (WASD + drag mouse), kalau ga ada pake kamera muter biasa
//   label: [{ teks, x, y, z, warna }, ...] -> tulisan di posisi 3D, muncul/ilang pake tombol G
export function mulaiScene(buatScene, jarakKamera) {
    var CANVAS = document.getElementById("mycanvas");
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }

    // canvas 2D di atas canvas webgl buat nulis label sama petunjuk
    var KANVAS2D = document.createElement("canvas");
    KANVAS2D.style.position = "absolute";
    KANVAS2D.style.left = "0";
    KANVAS2D.style.top = "0";
    KANVAS2D.style.pointerEvents = "none";
    KANVAS2D.width = window.innerWidth;
    KANVAS2D.height = window.innerHeight;
    document.body.appendChild(KANVAS2D);
    var CTX = KANVAS2D.getContext("2d");

    /*========================= MOUSE ========================= */
    var AMORTIZATION = 0.95;
    var drag = false;
    var x_prev, y_prev;
    var dX = 0, dY = 0;
    var THETA = 0, PHI = 0.3;
    var jarak = jarakKamera || 10;

    // kamera bebas: posisi kamera, yaw = nengok kiri kanan, pitch = nengok atas bawah
    var modeBebas = false;
    var posKamera = [0, jarak * 0.48, jarak * 0.8];
    var yaw = 0, pitch = 0.55;

    var mouseDown = function (e) {
        drag = true;
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
        return false;
    };

    var mouseUp = function (e) {
        drag = false;
    };

    var mouseMove = function (e) {
        if (!drag) return false;
        dX = (e.pageX - x_prev) * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * Math.PI / CANVAS.height;
        if (modeBebas) {
            yaw += dX;
            pitch += dY;
            dX = 0, dY = 0;
        } else {
            THETA += dX;
            PHI += dY;
        }
        x_prev = e.pageX, y_prev = e.pageY;
        e.preventDefault();
    };

    // scroll: kamera biasa = zoom, kamera bebas = maju mundur
    var mouseWheel = function (e) {
        if (modeBebas) {
            gerakKamera(-e.deltaY * 0.02, 0, 0);
        } else {
            jarak += e.deltaY * 0.01;
            jarak = Math.min(Math.max(jarak, 2), 40);
        }
        e.preventDefault();
    };

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);
    CANVAS.addEventListener("wheel", mouseWheel, false);

    /*========================= KEYBOARD ========================= */
    var tombol = {};
    var tampilLabel = false;

    window.addEventListener("keydown", function (e) {
        var k = e.key.toLowerCase();
        tombol[k] = true;
        if (k == "g") tampilLabel = !tampilLabel;
    });
    window.addEventListener("keyup", function (e) {
        tombol[e.key.toLowerCase()] = false;
    });
    // kalau pindah tab tombolnya dilepas semua biar kamera ga jalan sendiri
    window.addEventListener("blur", function () {
        tombol = {};
    });

    /*========================= SHADERS ========================= */
    var shader_vertex_source = `
        attribute vec3 position;
        attribute vec3 normal;
        uniform mat4 Pmatrix, Vmatrix, Mmatrix;
        varying vec3 vNormal;
        varying vec3 vView;

        void main(void) {
            vec4 posView = Vmatrix * Mmatrix * vec4(position, 1.);
            gl_Position = Pmatrix * posView;
            vNormal = vec3(Vmatrix * Mmatrix * vec4(normal, 0.));
            vView = posView.xyz;
        }`;

    var shader_fragment_source = `
        precision mediump float;
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vView;

        void main(void) {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(-vView);
            // biar urutan faces kebalik tetap kena cahaya
            if (dot(N, V) < 0.) N = -N;

            vec3 L = normalize(vec3(0.4, 0.8, 0.6));
            float diffuse = max(dot(N, L), 0.);
            vec3 R = reflect(-L, N);
            float specular = pow(max(dot(R, V), 0.), 20.) * 0.3;

            vec3 warna = uColor * (0.35 + 0.65 * diffuse) + vec3(specular);
            gl_FragColor = vec4(warna, 1.);
        }`;

    var compile_shader = function (source, type, typeString) {
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN " + typeString + " SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };

    var shader_vertex = compile_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
    var shader_fragment = compile_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

    var SHADER_PROGRAM = GL.createProgram();
    GL.attachShader(SHADER_PROGRAM, shader_vertex);
    GL.attachShader(SHADER_PROGRAM, shader_fragment);
    GL.linkProgram(SHADER_PROGRAM);

    var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
    var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");

    Objek.shader = {
        position: GL.getAttribLocation(SHADER_PROGRAM, "position"),
        normal: GL.getAttribLocation(SHADER_PROGRAM, "normal"),
        Mmatrix: GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix"),
        color: GL.getUniformLocation(SHADER_PROGRAM, "uColor")
    };

    GL.enableVertexAttribArray(Objek.shader.position);
    GL.enableVertexAttribArray(Objek.shader.normal);
    GL.useProgram(SHADER_PROGRAM);

    /*========================= MATRIX ========================= */
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 0.5, 150);
    var VIEWMATRIX = LIBS.get_I4();

    window.addEventListener("resize", function () {
        CANVAS.width = window.innerWidth;
        CANVAS.height = window.innerHeight;
        KANVAS2D.width = window.innerWidth;
        KANVAS2D.height = window.innerHeight;
        PROJMATRIX = LIBS.get_projection(40, CANVAS.width / CANVAS.height, 0.5, 150);
    });

    // gerakin kamera bebas: maju (ke arah liat), kanan, naik
    function gerakKamera(maju, kanan, naik) {
        // baris ke-3 VIEWMATRIX = arah belakang kamera, baris ke-1 = arah kanan kamera
        var m = VIEWMATRIX;
        posKamera[0] += -m[2] * maju + m[0] * kanan;
        posKamera[1] += -m[6] * maju + m[4] * kanan + naik;
        posKamera[2] += -m[10] * maju + m[8] * kanan;
    }

    /*========================= LANTAI ========================= */
    var lantai = new Objek(GL,
        [
            -10, 0, -10,
            10, 0, -10,
            10, 0, 10,
            -10, 0, 10
        ],
        [0, 2, 1, 0, 3, 2],
        [0.45, 0.5, 0.45]
    );

    var scene = buatScene(GL);
    modeBebas = scene.kamera == "bebas";

    /*========================= LABEL ========================= */
    // ubah posisi 3D jadi posisi di layar, null kalau di belakang kamera
    function keLayar(x, y, z) {
        var PV = LIBS.multiply(PROJMATRIX, VIEWMATRIX);
        var cx = PV[0] * x + PV[4] * y + PV[8] * z + PV[12];
        var cy = PV[1] * x + PV[5] * y + PV[9] * z + PV[13];
        var cw = PV[3] * x + PV[7] * y + PV[11] * z + PV[15];
        if (cw <= 0.1) return null;
        return [(cx / cw + 1) / 2 * KANVAS2D.width, (1 - cy / cw) / 2 * KANVAS2D.height];
    }

    function gambar2D() {
        CTX.clearRect(0, 0, KANVAS2D.width, KANVAS2D.height);
        CTX.textAlign = "center";
        CTX.textBaseline = "middle";

        if (tampilLabel && scene.label) {
            CTX.font = "bold 13px monospace";
            for (var l of scene.label) {
                var p = keLayar(l.x, l.y, l.z);
                if (!p) continue;
                var lebar = CTX.measureText(l.teks).width + 8;
                CTX.fillStyle = "rgba(0, 0, 0, 0.55)";
                CTX.fillRect(p[0] - lebar / 2, p[1] - 9, lebar, 18);
                CTX.fillStyle = l.warna || "white";
                CTX.fillText(l.teks, p[0], p[1]);
            }
        }

        // petunjuk tombol di pojok kiri bawah
        if (modeBebas || scene.label) {
            var tulisan = [];
            if (modeBebas) tulisan.push("WASD: gerak   Q/E: turun/naik   Shift: cepet   drag mouse: nengok");
            if (scene.label) tulisan.push("G: " + (tampilLabel ? "sembunyiin" : "tampilin") + " koordinat petak");
            CTX.font = "13px monospace";
            CTX.textAlign = "left";
            for (var i = 0; i < tulisan.length; i++) {
                var yy = KANVAS2D.height - 16 - (tulisan.length - 1 - i) * 18;
                CTX.fillStyle = "rgba(0, 0, 0, 0.5)";
                CTX.fillRect(8, yy - 9, CTX.measureText(tulisan[i]).width + 10, 18);
                CTX.fillStyle = "white";
                CTX.fillText(tulisan[i], 13, yy);
            }
        }
    }

    /*========================= DRAWING ========================= */
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);
    GL.clearColor(0.15, 0.15, 0.2, 1.0);
    GL.clearDepth(1.0);

    var time_prev = 0;
    var animate = function (time) {
        var dt = Math.min((time - time_prev) / 1000, 0.1);
        time_prev = time;

        if (modeBebas) {
            pitch = Math.min(Math.max(pitch, -1.5), 1.5);

            // susun VIEWMATRIX = rotasi x geser ke posisi kamera
            LIBS.set_I4(VIEWMATRIX);
            LIBS.rotateY(VIEWMATRIX, yaw);
            LIBS.rotateX(VIEWMATRIX, pitch);
            var m = VIEWMATRIX, p = posKamera;
            m[12] = -(m[0] * p[0] + m[4] * p[1] + m[8] * p[2]);
            m[13] = -(m[1] * p[0] + m[5] * p[1] + m[9] * p[2]);
            m[14] = -(m[2] * p[0] + m[6] * p[1] + m[10] * p[2]);

            // WASD gerak, Q/E turun naik, shift biar cepet
            var cepat = (tombol["shift"] ? 24 : 8) * dt;
            var maju = (tombol["w"] ? 1 : 0) - (tombol["s"] ? 1 : 0);
            var kanan = (tombol["d"] ? 1 : 0) - (tombol["a"] ? 1 : 0);
            var naik = (tombol["e"] ? 1 : 0) - (tombol["q"] ? 1 : 0);
            gerakKamera(maju * cepat, kanan * cepat, naik * cepat);
        } else {
            if (!drag) {
                dX *= AMORTIZATION, dY *= AMORTIZATION;
                THETA += dX, PHI += dY;
            }
            PHI = Math.min(Math.max(PHI, -0.2), 1.5);

            LIBS.set_I4(VIEWMATRIX);
            LIBS.rotateY(VIEWMATRIX, THETA);
            LIBS.rotateX(VIEWMATRIX, PHI);
            LIBS.set_position(VIEWMATRIX, 0, -1, -jarak);
        }

        if (scene.animasi) scene.animasi(time);

        GL.viewport(0, 0, CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);

        // lantai abu2 bawaan, bisa dimatiin kalau scene nya punya lantai sendiri (lantai: false)
        if (scene.lantai !== false) lantai.render(LIBS.get_I4());
        for (var objek of scene.objek) {
            objek.render(LIBS.get_I4());
        }

        GL.flush();
        gambar2D();
        window.requestAnimationFrame(animate);
    };
    animate(0);
}
