precision mediump float;

uniform sampler2D sBase;
uniform vec4 uColor;

varying vec2 vTexCoord;

void main() {
  gl_FragColor = texture2D(sBase, vTexCoord) * uColor;
}
