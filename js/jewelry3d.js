/**
 * NOIR — High-Craft WebGL2 Studio 3D Jewelry Turntable
 * Renders frameless, floating luxury platinum, black-diamond, and pearl pieces
 * with procedural studio softbox reflections, hover zoom, and smooth 360° axial spin.
 */
(function (global) {
  'use strict';

  const VS_SOURCE = `#version 300 es
  precision highp float;

  in vec3 aPosition;
  in vec3 aNormal;

  uniform mat4 uModel;
  uniform mat4 uView;
  uniform mat4 uProj;
  uniform mat3 uNormalMatrix;

  out vec3 vWorldPos;
  out vec3 vNormal;

  void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(uNormalMatrix * aNormal);
    gl_Position = uProj * uView * worldPos;
  }`;

  const FS_SOURCE = `#version 300 es
  precision highp float;

  in vec3 vWorldPos;
  in vec3 vNormal;

  uniform vec3 uCamPos;
  uniform int uMaterialType; // 0 = mirror platinum, 1 = black diamond, 2 = white diamond, 3 = south sea pearl, 4 = brushed dark rhodium
  uniform float uHover;

  out vec4 fragColor;

  // High-contrast black & white editorial studio softbox reflection map
  vec3 sampleStudioEnv(vec3 R) {
    vec3 dir = normalize(R);
    float grad = smoothstep(-0.75, 0.85, dir.y);
    vec3 env = mix(vec3(0.035, 0.038, 0.042), vec3(0.26, 0.265, 0.28), grad);

    // Overhead studio strip softbox
    float topStrip = smoothstep(0.60, 0.92, dir.y) * smoothstep(0.45, 0.08, abs(dir.x)) * smoothstep(0.65, 0.12, abs(dir.z));
    env += vec3(2.6) * topStrip;

    // Left vertical jewelers' key softbox
    float leftBox = smoothstep(0.32, 0.72, -dir.x) * smoothstep(0.58, 0.14, abs(dir.y - 0.16)) * smoothstep(0.68, 0.1, abs(dir.z - 0.30));
    env += vec3(2.25) * leftBox;

    // Right vertical fill strip
    float rightStrip = smoothstep(0.42, 0.82, dir.x) * smoothstep(0.28, 0.05, abs(dir.z + 0.12)) * smoothstep(0.75, 0.1, abs(dir.y));
    env += vec3(1.65) * rightStrip;

    // Front soft fill card
    float frontBounce = smoothstep(0.66, 0.96, dir.z) * smoothstep(0.65, 0.12, abs(dir.y - 0.08));
    env += vec3(0.92) * frontBounce;

    // Crisp black negative-fill horizon flags for sharp silver/platinum silhouette contrast
    float darkBand = smoothstep(0.18, 0.02, abs(dir.y + 0.09)) * smoothstep(0.38, 0.88, abs(dir.x));
    env *= mix(1.0, 0.18, darkBand);

    return env;
  }

  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCamPos - vWorldPos);
    float NoV = max(dot(N, V), 0.001);
    vec3 R = reflect(-V, N);

    vec3 envSharp = sampleStudioEnv(R);
    vec3 envSoft = (
      sampleStudioEnv(normalize(R + vec3(0.12, 0.04, 0.0))) +
      sampleStudioEnv(normalize(R - vec3(0.12, 0.04, 0.0))) +
      sampleStudioEnv(normalize(R + vec3(0.0, 0.12, 0.04))) +
      sampleStudioEnv(normalize(R - vec3(0.0, 0.12, 0.04)))
    ) * 0.25;

    vec3 L1 = normalize(vec3(2.5, 3.6, 2.8));
    vec3 L2 = normalize(vec3(-2.8, 1.4, 2.0));
    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);

    vec3 color = vec3(0.0);

    if (uMaterialType == 0) {
      // Mirror-polished Platinum with high-fashion B&W editorial contrast
      vec3 F0 = vec3(0.84, 0.85, 0.88);
      vec3 F = fresnelSchlick(NoV, F0);
      vec3 spec = mix(envSoft, envSharp, 0.85) * F;
      float glint1 = pow(max(dot(N, H1), 0.0), 150.0) * 1.45;
      float glint2 = pow(max(dot(N, H2), 0.0), 110.0) * 0.85;
      vec3 baseDiffuse = vec3(0.08, 0.085, 0.095) * (0.28 + 0.72 * max(dot(N, L1), 0.0));
      color = baseDiffuse + spec * 0.82 + vec3(glint1 + glint2);
    } else if (uMaterialType == 1) {
      // Faceted Black Diamond (Carbonado) - jet-black obsidian body + razor-sharp mirror facet flashes
      vec3 F0 = vec3(0.035, 0.036, 0.040);
      vec3 F = fresnelSchlick(NoV, F0);
      float facetFlash = pow(max(dot(N, H1), 0.0), 480.0) * 3.8 + pow(max(dot(N, H2), 0.0), 360.0) * 2.2;
      float rimFlash = pow(1.0 - NoV, 5.2) * 0.10;
      color = vec3(0.003, 0.0035, 0.0045) + envSharp * (F * 0.11) + vec3(facetFlash + rimFlash);
    } else if (uMaterialType == 2) {
      // Brilliant White Pavé Diamond - crisp refractive sparkle
      vec3 F0 = vec3(0.24, 0.24, 0.26);
      vec3 F = fresnelSchlick(NoV, F0);
      vec3 refractSim = sampleStudioEnv(normalize(refract(-V, N, 0.42)));
      float dispR = sampleStudioEnv(normalize(refract(-V, N, 0.40))).r;
      float dispB = sampleStudioEnv(normalize(refract(-V, N, 0.45))).b;
      vec3 prism = vec3(dispR, refractSim.g, dispB) * 0.75;
      float fire = pow(max(dot(N, H1), 0.0), 290.0) * 4.8 + pow(max(dot(N, H2), 0.0), 200.0) * 2.8;
      color = prism * 0.52 + envSharp * (F * 1.35) + vec3(fire);
    } else if (uMaterialType == 3) {
      // Luminous South Sea Pearl - deep sculptural volume, silky nacre & glowing highlight
      vec3 pearlBase = vec3(0.68, 0.675, 0.66);
      float keyDiff = max(dot(N, L1), 0.0);
      float fillDiff = max(dot(N, L2), 0.0);
      float shade = 0.14 + pow(keyDiff, 1.15) * 0.72 + fillDiff * 0.18;
      float rim = pow(1.0 - NoV, 2.8);
      vec3 nacreTint = mix(vec3(0.95, 0.94, 0.92), vec3(0.84, 0.88, 0.92), 0.5 + 0.5 * sin(NoV * 6.28));
      float softLobe = pow(max(dot(N, H1), 0.0), 68.0) * 1.35 + pow(max(dot(N, H2), 0.0), 36.0) * 0.35;
      color = pearlBase * shade + envSoft * 0.11 + nacreTint * rim * 0.28 + vec3(softLobe);
    } else {
      // Deep Obsidian Rhodium Recess (stays visibly dark behind pavé stones)
      vec3 F0 = vec3(0.14, 0.145, 0.16);
      vec3 F = fresnelSchlick(NoV, F0);
      float glint = pow(max(dot(N, H1), 0.0), 140.0) * 0.45;
      color = vec3(0.012, 0.013, 0.016) + envSoft * F * 0.22 + vec3(glint);
    }

    // ACES filmic tone curve + gamma
    color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
    color = pow(clamp(color, 0.0, 1.0), vec3(1.0 / 2.2));
    color *= (1.0 + uHover * 0.04);

    fragColor = vec4(color, 1.0);
  }`;

  const Mat4 = {
    identity() {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
    multiply(a, b) {
      const out = new Float32Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          out[j * 4 + i] =
            a[0 * 4 + i] * b[j * 4 + 0] +
            a[1 * 4 + i] * b[j * 4 + 1] +
            a[2 * 4 + i] * b[j * 4 + 2] +
            a[3 * 4 + i] * b[j * 4 + 3];
        }
      }
      return out;
    },
    perspective(fovRad, aspect, near, far) {
      const f = 1.0 / Math.tan(fovRad / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ]);
    },
    lookAt(eye, target, up) {
      const zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
      let len = Math.hypot(zx, zy, zz) || 1;
      const z = [zx / len, zy / len, zz / len];
      const xx = up[1] * z[2] - up[2] * z[1];
      const xy = up[2] * z[0] - up[0] * z[2];
      const xz = up[0] * z[1] - up[1] * z[0];
      len = Math.hypot(xx, xy, xz) || 1;
      const x = [xx / len, xy / len, xz / len];
      const y = [
        z[1] * x[2] - z[2] * x[1],
        z[2] * x[0] - z[0] * x[2],
        z[0] * x[1] - z[1] * x[0]
      ];
      return new Float32Array([
        x[0], y[0], z[0], 0,
        x[1], y[1], z[1], 0,
        x[2], y[2], z[2], 0,
        -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
        -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
        -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
        1
      ]);
    },
    translate(x, y, z) {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
    },
    scale(sx, sy, sz) {
      return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
    },
    rotateX(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    },
    rotateY(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    },
    rotateZ(rad) {
      const c = Math.cos(rad), s = Math.sin(rad);
      return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
    normalMatrix(m) {
      const a00 = m[0], a01 = m[1], a02 = m[2];
      const a10 = m[4], a11 = m[5], a12 = m[6];
      const a20 = m[8], a21 = m[9], a22 = m[10];
      const b01 = a22 * a11 - a12 * a21;
      const b11 = -a22 * a10 + a12 * a20;
      const b21 = a21 * a10 - a11 * a20;
      let det = a00 * b01 + a01 * b11 + a02 * b21;
      if (!det) return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
      det = 1.0 / det;
      return new Float32Array([
        b01 * det,
        (-a22 * a01 + a02 * a21) * det,
        (a12 * a01 - a02 * a11) * det,
        b11 * det,
        (a22 * a00 - a02 * a20) * det,
        (-a12 * a00 + a02 * a10) * det,
        b21 * det,
        (-a21 * a00 + a01 * a20) * det,
        (a11 * a00 - a01 * a10) * det
      ]);
    }
  };

  // ---- Parametric Geometry Generators ----
  function createEllipticalTorus(rx, rz, tubeR, segU, segV, flattenY) {
    const pos = [], norm = [], idx = [];
    const fy = flattenY || 1.0;

    for (let u = 0; u <= segU; u++) {
      const theta = (u / segU) * Math.PI * 2;
      const cosT = Math.cos(theta), sinT = Math.sin(theta);
      const cx = rx * cosT, cz = rz * sinT;
      let nx = cosT / rx, nz = sinT / rz;
      const nLen = Math.hypot(nx, nz) || 1;
      nx /= nLen; nz /= nLen;

      for (let v = 0; v <= segV; v++) {
        const phi = (v / segV) * Math.PI * 2;
        const cosP = Math.cos(phi), sinP = Math.sin(phi);
        const vx = cx + tubeR * cosP * nx;
        const vy = tubeR * sinP * fy;
        const vz = cz + tubeR * cosP * nz;
        const snx = cosP * nx, sny = sinP / fy, snz = cosP * nz;
        const sLen = Math.hypot(snx, sny, snz) || 1;
        pos.push(vx, vy, vz);
        norm.push(snx / sLen, sny / sLen, snz / sLen);
      }
    }
    for (let u = 0; u < segU; u++) {
      for (let v = 0; v < segV; v++) {
        const a = u * (segV + 1) + v;
        const b = (u + 1) * (segV + 1) + v;
        const c = (u + 1) * (segV + 1) + (v + 1);
        const d = u * (segV + 1) + (v + 1);
        idx.push(a, b, d, b, c, d);
      }
    }
    return { positions: new Float32Array(pos), normals: new Float32Array(norm), indices: new Uint16Array(idx) };
  }

  // Swept tubular ribbon along an arbitrary 3D curve (for the sculptural platinum teardrop cradle)
  function createRibbonFromCurve(points, radiusFn, segV) {
    const pos = [], norm = [], idx = [];
    const nPts = points.length;

    for (let i = 0; i < nPts; i++) {
      const pPrev = points[Math.max(0, i - 1)];
      const pNext = points[Math.min(nPts - 1, i + 1)];
      let tx = pNext[0] - pPrev[0];
      let ty = pNext[1] - pPrev[1];
      let tz = pNext[2] - pPrev[2];
      let tLen = Math.hypot(tx, ty, tz) || 1;
      tx /= tLen; ty /= tLen; tz /= tLen;

      // Reference vector avoiding collinearity
      const ref = Math.abs(tz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      // Binormal = normalize(cross(T, ref))
      let bx = ty * ref[2] - tz * ref[1];
      let by = tz * ref[0] - tx * ref[2];
      let bz = tx * ref[1] - ty * ref[0];
      let bLen = Math.hypot(bx, by, bz) || 1;
      bx /= bLen; by /= bLen; bz /= bLen;
      // Normal = cross(B, T)
      const nx = by * tz - bz * ty;
      const ny = bz * tx - bx * tz;
      const nz = bx * ty - by * tx;

      const tNorm = i / (nPts - 1);
      const r = radiusFn(tNorm);

      for (let v = 0; v <= segV; v++) {
        const phi = (v / segV) * Math.PI * 2;
        const cosP = Math.cos(phi), sinP = Math.sin(phi);
        const rx = cosP * nx * r[0] + sinP * bx * r[1];
        const ry = cosP * ny * r[0] + sinP * by * r[1];
        const rz = cosP * nz * r[0] + sinP * bz * r[1];
        pos.push(points[i][0] + rx, points[i][1] + ry, points[i][2] + rz);

        const sLen = Math.hypot(rx, ry, rz) || 1;
        norm.push(rx / sLen, ry / sLen, rz / sLen);
      }
    }

    for (let i = 0; i < nPts - 1; i++) {
      for (let v = 0; v < segV; v++) {
        const a = i * (segV + 1) + v;
        const b = (i + 1) * (segV + 1) + v;
        const c = (i + 1) * (segV + 1) + (v + 1);
        const d = i * (segV + 1) + (v + 1);
        idx.push(a, b, d, b, c, d);
      }
    }
    return { positions: new Float32Array(pos), normals: new Float32Array(norm), indices: new Uint16Array(idx) };
  }

  function createSphere(radius, segLat, segLon, teardropFactor) {
    const pos = [], norm = [], idx = [];
    const td = teardropFactor || 0;

    for (let lat = 0; lat <= segLat; lat++) {
      const theta = (lat / segLat) * Math.PI;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);
      const taper = td !== 0 ? (1.0 - td * Math.max(0, cosT) * 0.48) : 1.0;

      for (let lon = 0; lon <= segLon; lon++) {
        const phi = (lon / segLon) * Math.PI * 2;
        const x = radius * taper * sinT * Math.cos(phi);
        const y = radius * (cosT + td * (cosT > 0 ? cosT * cosT * 0.42 : 0));
        const z = radius * taper * sinT * Math.sin(phi);
        pos.push(x, y, z);
        const len = Math.hypot(x, y, z) || 1;
        norm.push(x / len, y / len, z / len);
      }
    }

    for (let lat = 0; lat < segLat; lat++) {
      for (let lon = 0; lon < segLon; lon++) {
        const a = lat * (segLon + 1) + lon;
        const b = a + segLon + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { positions: new Float32Array(pos), normals: new Float32Array(norm), indices: new Uint16Array(idx) };
  }

  function createFacetedGem(radius, heightTop, heightBot, sides, isCushion) {
    const rawPos = [];
    const tableScale = 0.56;
    const girdlePoints = [], tablePoints = [];

    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      let rMod = 1.0;
      if (isCushion) {
        const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
        rMod = 1.0 / Math.pow(Math.pow(c, 3.2) + Math.pow(s, 3.2), 1 / 3.2);
      }
      girdlePoints.push([Math.cos(a) * radius * rMod, 0, Math.sin(a) * radius * rMod]);
      tablePoints.push([Math.cos(a) * radius * rMod * tableScale, heightTop, Math.sin(a) * radius * rMod * tableScale]);
    }
    const tableCenter = [0, heightTop, 0];
    const culet = [0, -heightBot, 0];
    const pushTri = (p1, p2, p3) => rawPos.push(...p1, ...p2, ...p3);

    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      pushTri(tableCenter, tablePoints[next], tablePoints[i]);
      pushTri(tablePoints[i], tablePoints[next], girdlePoints[i]);
      pushTri(tablePoints[next], girdlePoints[next], girdlePoints[i]);
      pushTri(girdlePoints[i], girdlePoints[next], culet);
    }

    const pos = new Float32Array(rawPos);
    const norm = new Float32Array(rawPos.length);
    const idx = new Uint16Array(rawPos.length / 3);
    for (let i = 0; i < rawPos.length; i += 9) {
      const ax = rawPos[i], ay = rawPos[i + 1], az = rawPos[i + 2];
      const bx = rawPos[i + 3], by = rawPos[i + 4], bz = rawPos[i + 5];
      const cx = rawPos[i + 6], cy = rawPos[i + 7], cz = rawPos[i + 8];
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      for (let k = 0; k < 3; k++) {
        norm[i + k * 3] = nx; norm[i + k * 3 + 1] = ny; norm[i + k * 3 + 2] = nz;
        idx[i / 3 + k] = i / 3 + k;
      }
    }
    return { positions: pos, normals: norm, indices: idx };
  }

  function createChamferedBox(w, h, d) {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const faces = [
      { n: [0, 0, 1], v: [[-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]] },
      { n: [0, 0, -1], v: [[hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd]] },
      { n: [0, 1, 0], v: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]] },
      { n: [0, -1, 0], v: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]] },
      { n: [1, 0, 0], v: [[hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd]] },
      { n: [-1, 0, 0], v: [[-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd]] }
    ];
    const pos = [], norm = [], idx = [];
    faces.forEach((f, fi) => {
      f.v.forEach(p => { pos.push(...p); norm.push(...f.n); });
      const o = fi * 4;
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    return { positions: new Float32Array(pos), normals: new Float32Array(norm), indices: new Uint16Array(idx) };
  }

  class JewelryTurntable {
    constructor(canvas, preset) {
      this.canvas = canvas;
      this.preset = preset;
      this.gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false });
      if (!this.gl) return;

      this.hovered = false;
      this.hoverBlend = 0;
      this.scrollOffset = 0;
      this.rotY = preset === 'bracelet' ? 0.55 : preset === 'pearl' ? -0.32 : 0.52;
      this.baseRotY = this.rotY;
      this.rotX = preset === 'bracelet' ? 0.40 : preset === 'pearl' ? 0.14 : 0.44;
      this.baseRotX = this.rotX;
      this.dragging = false;
      this.lastPointer = { x: 0, y: 0 };
      this.dragVelY = 0;
      this.time = 0;

      this._initGL();
      this._buildScene(preset);
      this._bindEvents();
      this._resize();
    }

    _initGL() {
      const gl = this.gl;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS_SOURCE));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SOURCE));
      gl.linkProgram(prog);
      this.program = prog;
      this.locs = {
        aPosition: gl.getAttribLocation(prog, 'aPosition'),
        aNormal: gl.getAttribLocation(prog, 'aNormal'),
        uModel: gl.getUniformLocation(prog, 'uModel'),
        uView: gl.getUniformLocation(prog, 'uView'),
        uProj: gl.getUniformLocation(prog, 'uProj'),
        uNormalMatrix: gl.getUniformLocation(prog, 'uNormalMatrix'),
        uCamPos: gl.getUniformLocation(prog, 'uCamPos'),
        uMaterialType: gl.getUniformLocation(prog, 'uMaterialType'),
        uHover: gl.getUniformLocation(prog, 'uHover')
      };
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
    }

    _uploadMesh(geo) {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const pBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.positions, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.locs.aPosition);
      gl.vertexAttribPointer(this.locs.aPosition, 3, gl.FLOAT, false, 0, 0);

      const nBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
      gl.bufferData(gl.ARRAY_BUFFER, geo.normals, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.locs.aNormal);
      gl.vertexAttribPointer(this.locs.aNormal, 3, gl.FLOAT, false, 0, 0);

      const iBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

      gl.bindVertexArray(null);
      return { vao, count: geo.indices.length };
    }

    _buildScene(preset) {
      this.parts = [];

      if (preset === 'bracelet') {
        // Articulated Platinum & Recessed Black-Diamond Pavé Link Bracelet (matches macro-black.jpg)
        const railGeo = this._uploadMesh(createEllipticalTorus(1.16, 0.92, 0.048, 72, 20, 1.2));
        const linkBlockGeo = this._uploadMesh(createChamferedBox(0.36, 0.25, 0.13));
        const inlayBedGeo = this._uploadMesh(createChamferedBox(0.30, 0.17, 0.04));
        const blackStoneGeo = this._uploadMesh(createFacetedGem(0.027, 0.017, 0.02, 8, false));
        const whiteStoneGeo = this._uploadMesh(createFacetedGem(0.024, 0.016, 0.02, 8, false));
        const pinGeo = this._uploadMesh(createSphere(0.022, 8, 8));

        // Upper & lower precision platinum edge rails
        this.parts.push({ mesh: railGeo, mat: 0, local: Mat4.translate(0, 0.125, 0) });
        this.parts.push({ mesh: railGeo, mat: 0, local: Mat4.translate(0, -0.125, 0) });

        // 14 Articulated link plates forming the bracelet circumference
        const linkCount = 14;
        for (let i = 0; i < linkCount; i++) {
          const t = (i / linkCount) * Math.PI * 2;
          const x = 1.16 * Math.cos(t);
          const z = 0.92 * Math.sin(t);
          const angle = Math.atan2(x / 1.16, z / 0.92);

          const frameMat = Mat4.multiply(Mat4.translate(x, 0, z), Mat4.rotateY(angle));
          // Outer platinum link plate
          this.parts.push({ mesh: linkBlockGeo, mat: 0, local: frameMat });

          // Dark rhodium pavé recess cleanly seated forward of platinum frame
          const rx = 1.225 * Math.cos(t), rz = 0.985 * Math.sin(t);
          const bedMat = Mat4.multiply(Mat4.translate(rx, 0, rz), Mat4.rotateY(angle));
          this.parts.push({ mesh: inlayBedGeo, mat: 4, local: bedMat });

          // Micro-pavé black diamonds & luminous white diamond highlights inside every link
          for (let row = -1; row <= 1; row++) {
            for (let col = -2; col <= 2; col++) {
              const ox = col * 0.056;
              const oy = row * 0.048;
              const isWhiteAccent = (i % 3 === 0) && (Math.abs(col) <= 1) && (row === 0);
              const gemLocal = Mat4.multiply(
                bedMat,
                Mat4.multiply(Mat4.translate(ox, oy, 0.030), Mat4.rotateX(Math.PI / 2))
              );
              this.parts.push({
                mesh: isWhiteAccent ? whiteStoneGeo : blackStoneGeo,
                mat: isWhiteAccent ? 2 : 1,
                local: gemLocal
              });
            }
          }

          // Hinge pin accent between links
          const tMid = ((i + 0.5) / linkCount) * Math.PI * 2;
          this.parts.push({
            mesh: pinGeo,
            mat: 0,
            local: Mat4.translate(1.16 * Math.cos(tMid), 0.135, 0.92 * Math.sin(tMid))
          });
          this.parts.push({
            mesh: pinGeo,
            mat: 0,
            local: Mat4.translate(1.16 * Math.cos(tMid), -0.135, 0.92 * Math.sin(tMid))
          });
        }
      } else if (preset === 'pearl') {
        // Sculpted Platinum Teardrop Ribbon Cradle holding a Luminous South Sea Pearl (matches macro-pearl.jpg)
        const pearlGeo = this._uploadMesh(createSphere(0.42, 44, 44, 0.42));
        const paveGeo = this._uploadMesh(createFacetedGem(0.032, 0.018, 0.02, 8, false));
        const bailLoopGeo = this._uploadMesh(createEllipticalTorus(0.11, 0.19, 0.045, 40, 14, 1.0));
        const capCollarGeo = this._uploadMesh(createEllipticalTorus(0.11, 0.11, 0.038, 32, 12, 1.2));

        // Left & right continuous sweeping platinum ribbons meeting smoothly at top apex (y=0.78)
        const ptsLeft = [];
        const ptsRight = [];
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const a = u * Math.PI;
          const sinA = Math.sin(a);
          const xBase = -Math.pow(sinA, 1.12) * 0.60;
          const yBase = 0.78 - u * 1.56;
          const zDepth = Math.sin(u * Math.PI * 1.35) * 0.19;
          ptsLeft.push([xBase, yBase, zDepth]);
          ptsRight.push([-xBase * 0.95, yBase, -zDepth * 0.85]);
        }

        const ribbonLeft = this._uploadMesh(createRibbonFromCurve(ptsLeft, (u) => {
          const w = 0.056 + Math.sin(u * Math.PI) * 0.034;
          return [w, w * 0.64];
        }, 16));
        const ribbonRight = this._uploadMesh(createRibbonFromCurve(ptsRight, (u) => {
          const w = 0.048 + Math.sin(u * Math.PI) * 0.030;
          return [w, w * 0.64];
        }, 16));

        this.parts.push({ mesh: ribbonLeft, mat: 0, local: Mat4.identity() });
        this.parts.push({ mesh: ribbonRight, mat: 0, local: Mat4.identity() });

        // Luminous South Sea teardrop pearl cradled inside
        this.parts.push({
          mesh: pearlGeo,
          mat: 3,
          local: Mat4.translate(0, -0.18, 0.0)
        });

        // Seamless connected upper platinum collar & teardrop bail loop
        this.parts.push({
          mesh: capCollarGeo,
          mat: 0,
          local: Mat4.translate(0, 0.74, 0)
        });
        this.parts.push({
          mesh: bailLoopGeo,
          mat: 0,
          local: Mat4.multiply(Mat4.translate(0, 0.96, 0), Mat4.rotateZ(Math.PI / 2))
        });

        // Micro-pavé diamond accents tracing outer platinum ribbon & connected bail
        for (let i = 5; i <= steps - 6; i += 4) {
          const p = ptsLeft[i];
          this.parts.push({
            mesh: paveGeo,
            mat: 2,
            local: Mat4.multiply(Mat4.translate(p[0] * 1.04, p[1], p[2] + 0.055), Mat4.rotateX(Math.PI / 2))
          });
        }
        for (let k = -2; k <= 2; k++) {
          this.parts.push({
            mesh: paveGeo,
            mat: 2,
            local: Mat4.multiply(Mat4.translate(0, 0.88 + k * 0.06, 0.14), Mat4.rotateX(Math.PI / 2))
          });
        }
      } else {
        // Signature Cushion-Cut Black Diamond Pavé Halo Ring (matches ring-cushion-macro.jpg)
        const bandGeo = this._uploadMesh(createEllipticalTorus(0.92, 0.92, 0.068, 72, 20, 1.3));
        const haloFrameGeo = this._uploadMesh(createEllipticalTorus(0.56, 0.56, 0.055, 48, 16, 1.1));
        const cushionGemGeo = this._uploadMesh(createFacetedGem(0.42, 0.18, 0.26, 12, true));
        const paveGeo = this._uploadMesh(createFacetedGem(0.052, 0.032, 0.04, 8, false));
        const prongGeo = this._uploadMesh(createSphere(0.042, 10, 10));

        this.parts.push({ mesh: bandGeo, mat: 0, local: Mat4.rotateY(Math.PI / 2) });
        this.parts.push({
          mesh: haloFrameGeo,
          mat: 0,
          local: Mat4.multiply(Mat4.translate(0, 0.96, 0), Mat4.rotateY(Math.PI / 4))
        });
        this.parts.push({ mesh: cushionGemGeo, mat: 1, local: Mat4.translate(0, 1.04, 0) });

        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          this.parts.push({ mesh: prongGeo, mat: 0, local: Mat4.translate(Math.cos(a) * 0.42, 1.13, Math.sin(a) * 0.42) });
        }
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
          const rMod = 1.0 / Math.pow(Math.pow(c, 3.2) + Math.pow(s, 3.2), 1 / 3.2);
          this.parts.push({
            mesh: paveGeo,
            mat: 2,
            local: Mat4.translate(Math.cos(a) * 0.54 * rMod, 1.01, Math.sin(a) * 0.54 * rMod)
          });
        }
        for (const side of [-1, 1]) {
          for (let k = 1; k <= 6; k++) {
            const a = Math.PI / 2 + side * (0.48 + k * 0.14);
            this.parts.push({
              mesh: paveGeo,
              mat: 2,
              local: Mat4.multiply(Mat4.translate(Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0), Mat4.rotateZ(a - Math.PI / 2))
            });
          }
        }
      }
    }

    _bindEvents() {
      const el = this.canvas.parentElement || this.canvas;
      el.addEventListener('mouseenter', () => { this.hovered = true; });
      el.addEventListener('mouseleave', () => { this.hovered = false; this.dragging = false; });
      el.addEventListener('pointerdown', (e) => {
        this.dragging = true;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        el.setPointerCapture?.(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.rotY += dx * 0.012;
        this.rotX = Math.max(-1.1, Math.min(1.1, this.rotX + dy * 0.01));
        this.dragVelY = dx * 0.008;
        this.lastPointer = { x: e.clientX, y: e.clientY };
      });
      const stopDrag = () => { this.dragging = false; };
      el.addEventListener('pointerup', stopDrag);
      el.addEventListener('pointercancel', stopDrag);
      window.addEventListener('resize', () => this._resize());
    }

    _resize() {
      if (!this.gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(dt) {
      if (!this.gl || !this.canvas.width) return;
      const gl = this.gl;
      this.time += dt;

      const targetHover = this.hovered ? 1.0 : 0.0;
      this.hoverBlend += (targetHover - this.hoverBlend) * Math.min(1, dt * 6.0);

      if (!this.dragging) {
        if (this.hovered) {
          // On hover: continuous smooth 360-degree axial rotation
          this.rotY += dt * 1.45;
          const targetTilt = this.baseRotX + Math.sin(this.time * 1.7) * 0.16;
          this.rotX += (targetTilt - this.rotX) * Math.min(1, dt * 4.0);
        } else {
          this.rotY += this.dragVelY + dt * 0.12;
          this.dragVelY *= 0.92;
          this.rotX += (this.baseRotX - this.rotX) * Math.min(1, dt * 3.0);
        }
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);

      const aspect = this.canvas.width / this.canvas.height;
      // Smooth camera zoom in on hover (from 4.35 -> 3.25)
      const camDist = 4.35 - this.hoverBlend * 1.05;
      const focusY = this.preset === 'bracelet' ? 0 : this.preset === 'pearl' ? 0.14 : 0.25;
      const camPos = [0, focusY + 0.12, camDist];
      const view = Mat4.lookAt(camPos, [0, focusY, 0], [0, 1, 0]);
      const proj = Mat4.perspective(0.62, aspect, 0.1, 20.0);

      const floatY = Math.sin(this.time * 1.55) * 0.032;
      const scrollSpin = this.scrollOffset * 0.85;
      const rootTransform = Mat4.multiply(
        Mat4.translate(0, floatY, 0),
        Mat4.multiply(Mat4.rotateX(this.rotX), Mat4.rotateY(this.rotY + scrollSpin))
      );

      gl.uniformMatrix4fv(this.locs.uView, false, view);
      gl.uniformMatrix4fv(this.locs.uProj, false, proj);
      gl.uniform3fv(this.locs.uCamPos, camPos);
      gl.uniform1f(this.locs.uHover, this.hoverBlend);

      for (const part of this.parts) {
        const model = Mat4.multiply(rootTransform, part.local);
        const normMat = Mat4.normalMatrix(model);
        gl.uniformMatrix4fv(this.locs.uModel, false, model);
        gl.uniformMatrix3fv(this.locs.uNormalMatrix, false, normMat);
        gl.uniform1i(this.locs.uMaterialType, part.mat);
        gl.bindVertexArray(part.mesh.vao);
        gl.drawElements(gl.TRIANGLES, part.mesh.count, gl.UNSIGNED_SHORT, 0);
      }
      gl.bindVertexArray(null);
    }
  }

  const turntables = [];
  let rafStarted = false;
  let lastT = performance.now();

  function tick(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    for (const t of turntables) t.render(dt);
    requestAnimationFrame(tick);
  }

  global.NoirJewelry3D = {
    mount(canvas, preset) {
      if (!canvas) return null;
      const instance = new JewelryTurntable(canvas, preset);
      if (instance.gl) {
        turntables.push(instance);
        if (!rafStarted) {
          rafStarted = true;
          lastT = performance.now();
          requestAnimationFrame(tick);
        }
      }
      return instance;
    },
    resizeAll() {
      for (const t of turntables) t._resize();
    }
  };
})(window);
