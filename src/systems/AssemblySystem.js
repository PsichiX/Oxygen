import System from './System';

export default class AssemblySystem extends System {

  constructor() {
    super();

    this._assemblies = new Map();
    this._imports = new Map();
  }

  dispose() {
    super.dispose();

    const { _assemblies, _imports } = this;
    if (!!_assemblies) {
      _assemblies.clear();
    }
    if (!!_imports) {
      _imports.clear();
    }
    this._imports = null;
  }

  onUnregister() {
    const { _assemblies, _imports } = this;
    if (!!_assemblies) {
      _assemblies.clear();
    }
    if (!!_imports) {
      _imports.clear();
    }
  }

  registerImports(id, imports) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._imports.set(id, imports || {});
  }

  unregisterImports(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._imports.delete(id);
  }

  unregisterAllImports() {
    this._imports.clear();
  }

  getImports(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._imports.get(id) || null;
  }

  registerAssembly(id, wasmModule, imports) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(wasmModule instanceof WebAssembly.Module)) {
      throw new Error('`wasmModule` is not type of WebAssembly.Module!');
    }

    const instance = new WebAssembly.Instance(wasmModule, imports || {});
    this._assemblies.set(id, instance);
    return instance;
  }

  unregisterAssembly(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._assemblies.delete(id);
  }

  unregisterAllAssemblies() {
    this._assemblies.clear();
  }

  getAssembly(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._assemblies.get(id) || null;
  }

  getAssemblyExport(id, name) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }

    const assembly = this._assemblies.get(id);
    return !!assembly
      ? (assembly.exports[name] || null)
      : null;
  }

}
