function readPackage(pkg) {
  // cosmjs-types v0.11 has an exports map that blocks ".*.js" deep imports.
  // InterwovenKit imports these paths with .js extension.
  // Fix: remove the restrictive exports map so webpack can resolve by filesystem.
  if (pkg.name === 'cosmjs-types' && pkg.exports) {
    delete pkg.exports;
  }
  // Same issue with @cosmjs/amino
  if (pkg.name === '@cosmjs/amino' && pkg.exports) {
    delete pkg.exports;
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
