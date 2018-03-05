precision mediump float;

uniform sampler2D sPage0;
uniform sampler2D sPage1;
uniform sampler2D sPage2;
uniform sampler2D sPage3;
uniform vec4 uColor;
uniform vec4 uColorOutline;

varying vec2 vTexCoord;
varying float vPage;

vec4 getPageColor(int index, vec2 coord) {
  if (index == 0) {
    return texture2D(sPage0, coord);
  } else if (index == 1) {
    return texture2D(sPage1, coord);
  } else if (index == 2) {
    return texture2D(sPage2, coord);
  } else if (index == 3) {
    return texture2D(sPage3, coord);
  } else {
    return vec4(0.0);
  }
}

void main() {
  vec4 pix = getPageColor(int(vPage), vTexCoord);
  vec4 color = vec4(uColor.xyz, uColor.w * pix.x);
  vec4 outline = vec4(uColorOutline.xyz, uColorOutline.w * pix.y);
  gl_FragColor = mix(outline, color, pix.x);
}
