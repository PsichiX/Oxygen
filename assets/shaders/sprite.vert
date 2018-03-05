attribute vec2 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec2 vTexCoord;

void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 0.0, 1.0);
  vTexCoord = aTexCoord;
}
