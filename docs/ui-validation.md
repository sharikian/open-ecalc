# UI validation checklist

The Workbench is mobile-first and tested at 320, 375, 414, 768 and desktop
widths. The side rail becomes a bottom navigation bar below 40 rem; the
calculation action remains reachable above it. Inputs and buttons share a 44 px
minimum hit target, labels remain visible, and focus uses a 2 px ring.

RTL is the default when the device language starts with `fa`; the choice is
stored locally and can be toggled from the header. Numeric values always use
Latin digits and SI units. Charts keep their numeric axis in the conventional
left-to-right direction even when surrounding copy is RTL.

The preloader waits for the component catalog and `document.fonts.ready` and
does not add an artificial delay. Motion uses transform/opacity only and the
reduced-motion media query collapses spatial movement to a short crossfade.

