Isometric Drawing Toolkit is an API that provides components that manipulate and
display isometric drawings from a 3-dimensional definition. The store backing
the components are exposed via a React hook `useDrawingStore` which can be used
to create custom extensions.

## API Overview

A basic example of using the toolkit in React is as follows:

```html
<DrawingProvider>
  <RotationButton />
  <IsometricViewport />
</DrawingProvider>
```

If React is not the framework of choice, the library can be embedded along with
React on a static HTML page. Please see the
[minimal HTML template](./../embed/template.html).

Remember to place the Javascript library `isometric-drawing.js` alongside
the HTML page.
[Prebuilt Javascript library](./../dist/embed/isometric-drawing.js) is available
for convenience.

The template can alternatively be found under `embed/template.html` in the
repository. The Javascript library can be built locally with
`npm run build:lib` and then be found in `dist/embed/isometric-drawing.js`.

### Top-level Components

Top-level components are components that do not expect an external controller.
For example, although the cube component can display a cube on its own, its
parameters expect the user to tell it what elements to cull. And so it is not a
top-level component.

Top-level drawing components are listed in `lib.tsx` which are available for
embedding. Dialogs and controls within the `dialog` directory are also top-
level.

### Drawing Provider

The drawing provider tag provides a new drawing store for its child elements.
For example, if an isometric viewport is under the same provider as a coded
plan, the structure they refer to will be the same.

Components in the `drawing` directory require a drawing store, so any component
that resides there should have a drawing provider parent, direct or indirect.

An initial definition can be set for the provider, user is free to manipulate
the drawing afterwards, the changes will not be written back to the definition.
To avoid user manipulation, the following can be done:

 - Set `isInteractive` to false so that no new cube can be placed in an
   isometric drawing;
 - Omit `setMap` attribute to orthographic editor so that it is immutable.
 - Avoid putting control components under the provider.

If the initial definition is updated, all user manipulations are discarded and
the drawing will be snapped to the given definition.

> Note:
> Orthographic editor does not follow drawing provider as it does not represent
> a complete structure.

There is a drawing provider encompassing the entire app, this provides a drawing
store for the main viewport and allow components to pull in what is in the main
viewport when required. Then, each export card and card in the drawing dialog
contains a drawing provider to display their own drawing.

#### Definitions

Definition is an object that is stored for a drawing, it excludes ephemeral
states. It is tagged with a drawing kind when in storage, tagged definitions and
untagged definitions are both called `definition` in the code base.

There are two kinds of definitions:
 - `drawing`: Which represents a drawing backed by a structure;
 - `orthographic`: Which represents a line-based orthographic drawing;

## Isometric Drawing Interface Implementation Detail

> Note:
> The following sections are for maintenance convenience and are not related to
> the API.

The following sections are detail for maintaining the isometric drawing
interface and reference internal application components that are not exposed
in the API.

### Export Containers and Name Customization

Some user preferences affects the exported image but not the drawing on display,
this includes cropping and image splitting. Therefore there are usually two
displays: one hidden with all preferences applied for export and one visible for
displaying on screen. To mark a drawing for export, `wrapWithExportContainer`
should be used so that the CSS selector `.export-container` can be used.

For the drawing components, `data-export-name` attribute should be set to a
short name on the SVG elements to be included in the file name.

### Data Containers

Data containers (`data-container`) is an attribute for passing export cards'
drawing kind and preference as JSON back to the dialog for storing presets.
