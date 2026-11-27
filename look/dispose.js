// Letting go of 3D things that are finished with. Taking a mesh off the scene
// isn't enough: three.js keeps its shape and material on the graphics card
// (and a copy in memory) until told to free them, for as long as the page
// runs - and as the Windows shell, that's all day.

// Frees what an object, and everything inside it, holds: shapes, materials
// and their pictures. Only for things made for this one object.
//
// A material that's made once and used again and again (a chip's tracer
// colour, the course's aim line) is marked with shared() below and stays.
// Freeing it would make the graphics card rebuild the little drawing
// program behind it the next time it's used - at the moment a ball is
// launched, or at every nudge of the aim.
export function disposeTree(object) {
  object.traverse((o) => {
    // A batch (look/trees.js) holds its own shapes and its instances'
    // matrices and colours.
    // An instanced one holds its instances' matrices (and colours) too.
    if (o.isBatchedMesh) o.dispose();
    else if (o.isInstancedMesh) {
      o.geometry?.dispose();
      o.dispose();
    }
    // Every sprite (a label) shares one flat square, which stays.
    else if (!o.isSprite) o.geometry?.dispose();
    for (const m of [o.material].flat()) {
      if (!m || m.userData.shared) continue;
      m.map?.dispose();
      m.dispose();
    }
  });
}

// Marks a material as made once and used again and again, so disposeTree
// leaves it be. Returns the material.
export function shared(material) {
  material.userData.shared = true;
  return material;
}

// Empties a group (marks on the green, the aim line), freeing each thing in it.
export function clearGroup(group) {
  for (const o of group.children) disposeTree(o);
  group.clear();
}
