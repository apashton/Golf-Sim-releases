// Before a round in the phone app: a film of the course's first hole behind
// the card (the owner, 25 October 2026: "we need a custom flyover of each
// built in map already baked in. If it's a user defined map, we should have
// a generic fly over video until the real one loads"). A course the app
// comes with plays its own film at once and keeps it till the round starts
// - its hole built behind it for the round, nothing drawn under it; any
// other plays the generic film until its own first hole's on the screen
// (sim/flyfilms.mjs filmFor). The films are made by tools/flyfilms.mjs and
// put in the app by tools/androidweb.mjs; the PC has none, and shows the
// course's still as ever.
// Part of CourseMode (course.js), split out of it: these methods are
// added to CourseMode.prototype there and run with `this` the course.

import { cleanFilms, filmFor, FILMS_DIR } from "../sim/flyfilms.mjs";

export class CourseFilms {
  // The app's films, read once (in the phone app only: pocket/start.js).
  readFilms() {
    if (this.filmsRead || !window.pocket) return;
    this.filmsRead = true;
    fetch(`${FILMS_DIR}index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((index) => {
        this.films = index ? cleanFilms(index) : null;
        this.renderIntro();
      })
      .catch(() => {
        // None: the course's still, as on the PC.
      });
  }

  // The film behind the card for `next` (a course in the list), or none
  // (no card, or no film for it): true when one plays, in place of the
  // course's still.
  showFilm(next) {
    this.readFilms();
    const el = this.filmEl;
    const film = next ? filmFor(this.films, next.id, { shown: this.idle?.id === next.id && !!this.idle.shown }) : null;
    this.film = film;
    if (!film) {
      if (!el.classList.contains("gone")) {
        el.classList.add("gone");
        el.pause();
      }
      return false;
    }
    if (el.dataset.src !== film.src) {
      el.dataset.src = film.src;
      el.src = film.src;
    }
    el.classList.remove("gone");
    if (el.paused) el.play().catch(() => {});
    return true;
  }

  // Whether a course's own film covers the picture: nothing's drawn under
  // it (pictureHidden) - the hole's built behind it for the round.
  filmCovers() {
    return this.isActive && !!this.film?.own && !this.filmEl.classList.contains("gone");
  }
}
