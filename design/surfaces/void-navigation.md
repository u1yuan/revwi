# Surface brief: Void navigation

<!-- impeccable:surface-schema 1 -->

**Mode:** Experience  
**Theme:** Dark  
**Routes:** `/`, `/u/[year]`, `/c/[course]`, `/c/[course]/[assessment]` (setup only)

## Success

The student knows where they are in the multiverse and reaches a bank setup screen without reading 3D-only affordances.

## Layout

- Flight deck 64 px.
- Canvas full bleed.
- Route mirror always reachable (desktop: fixed side panel 280 px; mobile: "List" opens sheet).

## Motion

- Camera flights 1.2 s ease `[0.16, 1, 0.3, 1]`.
- Planet idle rotate 0.05 rad/s max.
- Reduced motion: instant camera set + opacity crossfade 200 ms.

## Content

- Empty states name the year or bank clearly.
- Locked moons never look clickable.
