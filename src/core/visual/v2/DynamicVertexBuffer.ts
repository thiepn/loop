export class DynamicVertexBuffer {
  private data = new Float32Array(0);
  private gpuCapacity = 0;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly buffer: WebGLBuffer,
  ) {}

  public upload(values: readonly number[]): number {
    const length = values.length;

    if (length === 0) {
      return 0;
    }

    if (this.data.length < length) {
      let capacity = Math.max(256, this.data.length || 256);

      while (capacity < length) {
        capacity *= 2;
      }

      this.data = new Float32Array(capacity);
    }

    this.data.set(values);

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    if (this.gpuCapacity < this.data.length) {
      this.gpuCapacity = this.data.length;
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.gpuCapacity * Float32Array.BYTES_PER_ELEMENT,
        gl.DYNAMIC_DRAW,
      );
    }

    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      this.data,
      0,
      length,
    );

    return length;
  }
}
