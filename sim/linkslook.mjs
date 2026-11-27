// Whether a hole is a links hole, from its layout as it's kept: a designed
// hole says so itself (layout.links); a real hole from a map has its look
// as an edit (the hole editor's, or the course-making tool's: "lk" -
// sim/holeedits), the last of them having the say. For asking of a whole
// course without applying every hole's edits (the course list's look, the
// side of a course its sea lies on). Pure.
export function linksLook(layout) {
  const edit = (layout?.edits ?? []).filter((e) => e?.k === "lk").at(-1);
  return (edit ? edit.look : layout?.links) || null;
}
