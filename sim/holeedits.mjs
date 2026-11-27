// Changing a hole by hand: moving trees, bunkers and water about on the map,
// digging a bunker deeper, reshaping and tilting the green, widening the
// fairway.
//
// A hole keeps its hand changes as a short list of edits (layout.edits),
// laid on top of the layout it was generated or mapped with. The layout
// itself is never changed, so:
//   - a designed hole can still be rebuilt from its spec (new options keep
//     the edits that still fit; only a new layout throws them away);
//   - a mapped hole keeps them when its trees or slopes are changed, or
//     LiDAR is applied again;
//   - undo is just a shorter list.
// Things are found by where they are (a bunker by its middle, a tree by
// its spot), not by their place in a list, so an edit still finds its
// bunker after the others have moved - and quietly does nothing if it has
// gone.
//
// Every edit is checked as it's applied, and one that would spoil the hole
// is left out: the cup stays on the green, the tee stays clear of sand,
// water and trees, water never floods the green, shapes stay a sensible
// size and trees keep off the greens, tees, fairways, sand, water and the
// middle of the hole.
//
// The edits (positions in the hole's frame, metres, two decimals):
//   { k: "t+", p: [[x, z, size], ...], kind?, w? } plant trees (of one kind:
//                                              sim/treeshapes.mjs KINDS'
//                                              index; none: as they grow)
//   { k: "t-", p: [[x, z], ...] }              take trees away
//   { k: "tm", p: [[x, z], ...], d: [dx, dz] } move trees
//   { k: "ts", p: [[x, z], ...], f }           make trees taller (f > 1) or shorter
//   { k: "tk", p: [[x, z], ...], kind }        make trees one kind (KINDS'
//                                              index), or (kind null) as
//                                              they grow again
//   { k: "tv", p: [[x, z], ...], shape }       give trees one variant of
//                                              their kind (a shape: 0 - 5),
//                                              or (null) their own again
//   { k: "b", at: [x, z], d?, f?, dig?, join? } move, resize or dig a bunker;
//                                              join 1 runs it right up to the
//                                              green, 0 sets it just off it
//   { k: "b+", at: [x, z] }                    a new bunker
//   { k: "b-", at: [x, z] }                    no bunker there any more
//   { k: "w", at, d?, f? } / "w+" / "w-"       the same for water
//   { k: "w", at, h: [12 sizes] }              a pond reshaped by the marks
//                                              round its edge (course.mjs
//                                              EDGE_MARKS: 1 each as made)
//   { k: "b" or "w", at, wall }                one stretch of its edge built
//                                              as a wall (sim/walls.mjs), or
//                                              (wall: 0) no wall any more
//   { k: "g", h: [12 sizes], f }               the green's shape and size
//   { k: "pin", p: [x, z] }                    where the cup is
//   { k: "tilt", a, n }                        the way the green falls
//                                              (radians) and how much (TILTS)
//   { k: "bump", p: [[x, z], ...], a }         bumps (a > 0) or hollows on it
//   { k: "fw", f }                             the fairway's width (a hole
//                                              from a map or on hills: its
//                                              own fairway, along its line)
//   { k: "edge", band, p: [[x, z], ...], a, r } a designed hole's edge moved
//                                              where the brush went: band
//                                              "fw" the fairway's, "cut" the
//                                              first cut's outer edge, "deep"
//                                              where deep rough starts; a
//                                              metres out (+) or in (-) at
//                                              each spot, easing off over r
//                                              metres along the line - or
//                                              (smooth: 1, no a) evened out
//   { k: "tg", on: 1 }                          its trees, bushes and the
//                                              trees behind its green grown
//                                              afresh, as this version grows
//                                              them (sim/treelock.mjs
//                                              liveLock: its kept ones let go)
//   { k: "sig", on: 0 }                         its signature tree taken away
//                                              (sim/signaturetree.mjs; on: 1
//                                              puts it back)
//   { k: "pots", on: 1 }                        every bunker made a links pot
//   { k: "bstyle", s }                          every bunker given a style's
//                                               shape (sim/course.mjs
//                                               BUNKER_STYLES: classic,
//                                               rugged, modern)
//                                              bunker (sim/course.mjs potBunker)
//   { k: "lk", look }                          a hole from a map made a links
//                                              hole ("dunes" or "green", its
//                                              look) or not ("")
//   { k: "fwn", on }                           a designed fairway's natural
//                                              line (each edge wandering on
//                                              its own) on (1) or off (0)
//   { k: "f", at: [x, z], f }                  one fairway of a hole from a
//                                              map or on hills - the one at
//                                              `at`, its spot (fairwayAnchor)
//                                              - made narrower or wider, f
//                                              against how it was made
//   { k: "f-", at: [x, z] }                    no fairway there any more
//   { k: "gh", o, n, lv?, d, s? }              the green shaped in detail: a
//                                              grid of its heights and shapes
//                                              stamped on (greensculpt.mjs)
//   { k: "p+", p: [[x, z], ...], m? }          a new cart path through those
//                                              points (sim/paths.mjs)
//   { k: "p-", at }                            no cart path there any more
//   { k: "p", at, d }                          the bend at `at` moved by d, or
//                                              (with all: 1, or no bend there)
//                                              the whole path
//   { k: "p", at, add: 1 } / { ..., drop: 1 }  a bend put in there, or taken out
//   { k: "p", at, m }                          what the path there is made of
//   { k: "r+", p: [[x, z], ...], kind?, w? }   a brook drawn through those
//                                              points (sim/brooks.mjs: kind a
//                                              brook, ditch or stream; w how
//                                              much wider than its kind)
//   { k: "r-", at }                            no brook there any more
//   { k: "r", at, p?, kind?, w?, banks? }      the brook at `at` drawn through
//                                              new points, made another kind
//                                              or width, or its walled
//                                              stretches of bank set (banks:
//                                              [{ side, s: [s0, s1], m }], []
//                                              for none)
//   { k: "pa", s }                             a path made for the hole down
//                                              the left (-1) or right (1), or
//                                              none (0), in place of any there
// "g", "pin", "tilt", "fw" and "gh" say how things are now, so only the
// last of each counts - and "f", for each fairway.
//
// Pure functions, shared by the designer, play and the tests.

// The code is in public/sim/holeedits/, a file for each part (see
// docs/ARCHITECTURE.md); this file is what everything imports, and names
// exactly what it always has.

export { BUNKER_RESTYLES, DEPTHS, TILTS, HANDLES, MAX_EDITS, LIP, GREEN_CLEAR, POND_BANK, JOIN_GAP, JOIN_REACH, BUMP } from "./holeedits/common.mjs";
export { insideDepth, shapeBounds, shapeAt, shapeUnder, newShape, shapeFits, shapeTrouble, moveShape, scaleShape, pondGivesWay, edgeOf, edgeMarks, edgeMarkSize, reshapeShape } from "./holeedits/shapes.mjs";
export { crownOf, treeSpotOk, treesNear, clumpAt } from "./holeedits/trees.mjs";
export { DEFAULT_GREEN, greenHandles, handleSize, reshapeGreen, pinOnGreen, tiltContour } from "./holeedits/green.mjs";
export { widenFairway, fairwaySpine, sizeFairway, fairwayAnchor, fairwayAt, fairwayWidth } from "./holeedits/fairway.mjs";
export { BEND_REACH, validEdit, editState, withEdits, applyEdits, EDGE_BANDS, EDGE_LIMITS, brookFits, pathChange, addEdit } from "./holeedits/apply.mjs";
export { gapTo, JOIN_PULL, joinBunker, faceWidth, DIG_BLEND, wallFace, groundShaping, clearCrowns, underHandTree } from "./holeedits/ground.mjs";
export { bunkerEdgeAhead, faceWidthAt, hitsFace } from "./holeedits/face.mjs";
