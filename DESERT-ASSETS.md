# Desert landscape assets

The distant dunes now use one continuous world-space plane with mirrored texture repeats. This replaces overlapping district planes that caused depth flicker. Wildlife uses three photo variants (standing, grazing, walking), with individual geometry baseline offsets to keep hooves grounded.

## desert-gazelle-grazing.png

Use case: photorealistic-natural. Asset type: genuinely transparent wildlife cutout for the Iranian desert in a real-time 3D landscape. One female Persian goitered gazelle grazing with head lowered toward the ground, slim tan body, white belly, short delicate horns, relaxed natural stance, full body side view, all four legs and hooves visible, ears visible, neck bent gracefully downward. Accurate animal anatomy, realistic textured fur and natural proportions. Warm late afternoon sunlight from upper left, restrained natural colors, photographic wildlife realism. Entire animal centered with generous transparent margin, hooves close to bottom baseline. Genuine transparent background, no scenery, no floor, no ground, no grass, no cast shadow, no other animals, no text. Approximately square composition.

## desert-gazelle-walking.png

Use case: photorealistic-natural. Asset type: genuinely transparent wildlife cutout for the Iranian desert in a real-time 3D landscape. One male Persian goitered gazelle walking slowly in profile toward the left, head held naturally forward, elegant curved horns, one front leg lifted mid step and rear legs staggered, slim tan body and white belly, full body including hooves and horn tips. This must be a clearly different walking pose from an animal standing and looking at camera. Accurate animal anatomy, realistic textured fur and natural proportions. Warm late afternoon sunlight from upper left, restrained natural colors, photographic wildlife realism. Entire animal centered with generous transparent margin, hooves close to bottom baseline. Genuine transparent background, no scenery, no floor, no ground, no grass, no cast shadow, no other animals, no text. Approximately square composition.

Generated with the built-in ImageGen tool for the right side of the promenade.
Original generated files remain in the Codex generated_images directory; runtime copies are in dist/assets.

## desert-sand-albedo.png

Use case: photorealistic-natural. Asset type: seamless repeating albedo ground texture for a real-time 3D Iranian desert landscape. Square, perfectly orthographic top down photograph of fine pale golden tan desert sand with subtle small wind ripples, scattered tiny mineral grains, very sparse pinhead gravel. Even neutral diffuse illumination, no baked directional shadows, no horizon, no vegetation, no large rocks, no text. Natural photographic detail, restrained contrast. All four edges must tile seamlessly. This is a sand surface texture, not a landscape photograph.

## desert-shrub-cutout.png

Use case: photorealistic-natural. Asset type: transparent vegetation cutout for 3D landscape billboards. A single natural clump of Iranian arid steppe vegetation: weathered straw-gold bunchgrass mixed with a small airy gray sage-green thorny desert shrub, many thin dry curling stems, fine branching twigs, sparse tiny leaves, realistic irregular delicate silhouette. Eye-level full specimen viewed from the side, entire clump visible including the root base, no cropping, generous transparent margin. Warm late afternoon light from upper left, softly shaded opposite side, photographic botanical realism. Width about 1.2 meters, height .7 meters. Genuine transparent background, isolated plant only; no ground plane, no sand, no scenery, no hard cast shadow, no pot, no text.

## desert-rocks-cutout.png

Use case: photorealistic-natural. Asset type: transparent environmental cutout for real-time 3D landscape. A single low natural grouping of three weathered Iranian desert limestone and sandstone rocks, a larger broad rounded angular ochre-gray boulder flanked by two smaller partly buried-looking rocks, chipped surfaces and fine mineral erosion, subtle tonal variation. Photograph at low eye level, entire grouping in frame, wide landscape composition, generous transparent margins. Warm late-afternoon light from upper left, soft shadows within the rock grouping. Width 2 meters, height .65 meters. Genuine transparent background, isolated rocks only, no floor, no terrain, no plants, no scenery, no text. High photographic realism, no stylized low-poly geometry.

The sand image textures a continuous 3D terrain. The transparent plant and rock images are instanced camera-facing cutouts, with varied size, position, tint and mirroring. They are confined outside the right colonnade, starting beyond x=26.2, and hidden together with their district. These are photographic cutouts rather than volumetric scanned vegetation or rock models.


## Additional wildlife and distant dunes

Generated with built-in ImageGen, saved to `dist/assets/desert-gazelle-cutout.png` and `dist/assets/desert-dunes-cutout.png`. Gazelles are static photographic cutouts placed on the terrain; distant dunes are fixed landscape cutouts with their lower edge buried in the terrain.

### Gazelle prompt

Use case: photorealistic-natural. Asset type: transparent animal cutout for a real-time Iranian desert landscape. One beautiful adult Persian goitered gazelle standing naturally, full body including all four slender legs and hooves and the tips of its elegant curved horns. Three-quarter side view, looking gently toward the camera, anatomically accurate, realistic tan fur, white belly and dark facial markings. Warm golden late afternoon sunlight from upper left, soft natural shading. Entire animal centered with generous empty transparent padding, hooves on the same baseline near bottom. Genuine transparent background. No ground, no landscape, no other animals, no text, no cast shadow. Photographic wildlife realism, not illustration.

### Dunes prompt

Use case: photorealistic-natural. Asset type: wide transparent distant landscape cutout for 3D Iranian desert scenery. A broad natural panoramic grouping of several rolling golden sand dunes with elegant wind-sculpted ridgelines, subtle fine sand ripples, sunlit warm ochre crests and softly shaded amber slopes. Low eye-level landscape photograph, approximately 3:1 aspect ratio. Warm late afternoon light from upper left. Entire upper dune silhouette cleanly isolated against genuine transparency, no sky, no sun, no mountains, no trees, no animals, no text, no rectangular backdrop. Dune mass occupies lower two thirds, naturally tapered sides with transparent margins, no clipped ridges. Bottom third is continuous opaque sandy foreground suitable for burying slightly inside 3D sandy terrain. Photographic natural realism, restrained color, no overly orange saturation.

