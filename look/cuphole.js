// A cup as it really looks, without cutting a hole in the green for it
// (golf pong's racks: a dozen or more of them, where the course's one cup
// has the green cut round it - greenscene.js makeCup): a disc over the
// cup's opening whose every pixel works out where its line of sight would
// meet the inside of a real cup - the crumbled soil just under the grass,
// the white liner, the dark wall below it, the floor - and whether the sun
// reaches that spot past the rim. So looking down the green, the white
// liner shows as a crescent on the far side and the near side is in the
// rim's shade, as a real cup does.

import * as THREE from "three";
import { sunDirection } from "./environment.js";
import { markTwin } from "./twins.js";

// Depths below the surface, metres: the soil, where the liner ends, the floor.
export const CUP_DEPTHS = { soil: 0.012, liner: 0.05, floor: 0.104 };

const VERTEX = /* glsl */ `
  varying vec3 cWorld;
  varying vec3 cCentre;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    cWorld = w.xyz;
    cCentre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float cR;
  uniform vec3 cSun;
  uniform vec3 cSoil;
  uniform vec3 cLiner;
  uniform vec3 cWall;
  uniform vec3 cFloor;
  uniform float cLight;
  varying vec3 cWorld;
  varying vec3 cCentre;
  const float SOIL = ${CUP_DEPTHS.soil.toFixed(4)};
  const float LINER = ${CUP_DEPTHS.liner.toFixed(4)};
  const float FLOOR = ${CUP_DEPTHS.floor.toFixed(4)};

  // Whether the sun reaches a spot d below the surface at q (across the
  // cup from its middle): its line to the sun must leave through the hole.
  float sunlit(vec2 q, float d) {
    vec2 out2 = q + cSun.xz / max(cSun.y, 0.05) * d;
    return 1.0 - smoothstep(cR * 0.97, cR, length(out2));
  }

  void main() {
    vec3 dir = normalize(cWorld - cameraPosition);
    vec2 p = cWorld.xz - cCentre.xz;
    vec3 col;
    float down = max(-dir.y, 1e-4);
    // Where the line of sight meets the wall: |p + t dir.xz| = R.
    float a = max(dot(dir.xz, dir.xz), 1e-8);
    float b = 2.0 * dot(p, dir.xz);
    float c = dot(p, p) - cR * cR;
    float tWall = (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a);
    float dWall = tWall * down;
    if (dWall < FLOOR) {
      vec2 q = p + dir.xz * tWall;
      vec2 inward = -q / cR;
      // The wall facing the sun is lit by it, if the rim doesn't shade it.
      float face = max(dot(inward, normalize(cSun.xz + 1e-5)), 0.0);
      float sun = sunlit(q, dWall) * (0.35 + 0.65 * face);
      vec3 base = dWall < SOIL ? cSoil : dWall < LINER ? cLiner : cWall;
      // Darker the deeper: less of the sky reaches down there.
      float sky = mix(0.55, 0.12, smoothstep(0.0, FLOOR, dWall));
      col = base * (sky + sun * 0.9);
    } else {
      float tFloor = FLOOR / down;
      vec2 q = p + dir.xz * tFloor;
      col = cFloor * (0.1 + 0.6 * sunlit(q, FLOOR));
    }
    gl_FragColor = vec4(col * cLight, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The material for a cup's opening (a disc of the hole's radius, lying flat).
export function cupHoleMaterial(radius) {
  const lin = (hex) => new THREE.Color(hex);
  const material = new THREE.ShaderMaterial({
    name: "CupHole",
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      cR: { value: radius },
      cSun: { value: sunDirection().clone().normalize() },
      cSoil: { value: lin(0x4a3a28) },
      cLiner: { value: lin(0xf0f0ea) },
      cWall: { value: lin(0x2e2a24) },
      cFloor: { value: lin(0x1e1a16) },
      // How bright, against the lit green round it.
      cLight: { value: 1.6 },
    },
  });
  // (Its node version, on WebGPURenderer: glsl/bitsnode.js.)
  return markTwin(material, "cuphole", { uniforms: material.uniforms, depths: CUP_DEPTHS });
}
