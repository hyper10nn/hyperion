export interface SampleScript {
  id: string;
  title: string;
  genre: string;
  defaultStyle: string;
  description: string;
  content: string;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'cyberpunk-heist',
    title: 'Neon Protocol: Rooftop Extraction',
    genre: 'Cyberpunk Sci-Fi Thriller',
    defaultStyle: 'Cinematic Concept Art, Blade Runner aesthetic, moody anamorphic lighting, wet asphalt reflections, volumetric neon fog',
    description: 'High-octane rainy rooftop escape under towering neon megastructures with surveillance drones.',
    content: `EXT. NEO-SHANGHAI MEGATOWER - ROOFTOP - NIGHT

Continuous torrential rain lashes against the mirror-finish solar tiles. Massive holographic koi fish swim through the smog between skyscrapers hundreds of stories above the street.

VALENTINA (30s), clad in a wet carbon-fiber tactical trench coat, sprints across the slippery helipad. Her cybernetic left eye pulses with a sharp amber targeting reticle.

She clutches a glowing encrypted quantum data drive against her chest.

Behind her, THREE ARASAKA ENFORCER DRONES slice through the downpour, dual crimson searchlights cutting diagonal beams through the steam vents.

VALENTINA
(whispering into comms)
Kael, tell me the dropship is ten seconds out, or I'm taking the plunge.

INT. KAEL'S HOVER-VAN - CONTINUOUS

KAEL (40s), greasy dreadlocks, frantically clatters keys across holographic consoles. Sparking wires dangle overhead.

KAEL
Jump at the edge, Val! Do not look down!

EXT. ROOFTOP - CONTINUOUS

Valentina reaches the perimeter ledge. Void beneath her. Two miles of sheer vertical glass drop into the neon abyss.

A drone fires a high-voltage EMP bolt. It explodes against the parapet in a shower of brilliant blue sparks!

She leaps into the empty rain-drenched air.

Just as gravity pulls her down, the stealth dropship decloaks underneath her feet, retro-thrusters igniting in blinding blue plasma flames!`
  },
  {
    id: 'western-standoff',
    title: 'High Noon in Deadwood Creek',
    genre: 'Gritty Neo-Western',
    defaultStyle: 'Photorealistic 35mm Film Still, Sergio Leone widescreen cinematography, golden dust, deep shadows, high contrast sunlight',
    description: 'A tense duel under scorching midday sun with heat shimmers, pocket watch ticking, and quickdraw.',
    content: `EXT. MAIN STREET - DEADWOOD CREEK - HIGH NOON

Heat waves ripple off the parched alkaline dirt. The clock tower bell STRIKES TWELVE with heavy, deliberate iron gongs.

A solitary tumbleweed scuttles past the swinging louver doors of the Silver Spur Saloon.

At the north end of the desolate street stands MARSHAL ELI CARTER (50s), dust-caked duster coat, weathered brim pulled low over flint-gray eyes. His hand hovers an inch above his ivory-handled Colt .45.

At the south end stands "COLD" SILAS VANCE (30s), dressed in gambler's black, silver spurs, a jagged scar across his cheekbone. Vance smirks, slowly biting down on an unlit cigarillo.

EXTREME CLOSE UP - ELI'S EYES

Unblinking. Sweat beads slide down his temple. The shadow of the brim cuts straight across his stare.

EXTREME CLOSE UP - SILAS'S HAND

Twitching lightly. Fingers flex with lethal muscle memory.

WIDE ANGLE - BETWEEN THEM

Sixty paces of empty dirt. A feral wind whips up a sudden dust devil between the two gunmen.

SILAS
Town wasn't ever big enough for two men with our kind of past, Eli.

ELI
Then draw, Silas. And let the devil sort out the bill.

A crow caws and takes flight from the saloon gutter. In a blur of leather and smoke, both men draw!`
  },
  {
    id: 'deep-sea-horror',
    title: 'The Abyss Station: Hull Breach',
    genre: 'Atmospheric Sci-Fi Horror',
    defaultStyle: 'Dark cinematic realism, James Cameron The Abyss tone, eerie bioluminescent emerald and deep navy lighting, claustrophobic industrial textures',
    description: 'Deep sea exploration vessel at 10,000 meters discovers something unnatural against the viewport.',
    content: `INT. HADAL LAB - SECTOR 4 - NIGHT (CYCLE 0300)

Total subterranean gloom. Only the intermittent rhythm of emergency amber beacons sweeps across pressurized titanium bulkheads.

DR. ASTRID LIND (40s), wearing an insulated drysuit, wipes condensation from the six-inch thick acrylic observation dome.

Outside: the boundless, crushing midnight of the Mariana Trench. 36,000 feet down.

DR. LIND
Sonar, report that contact again. I have visual on nothing but silt.

INTERCOM - MATEO (V.O.)
(distorted static)
It's pinging thirty meters out, Doc... wait. It's moving faster than any current. It just stopped dead.

Astrid leans closer to the glass. Her breath fogs the viewport.

Suddenly, five meters outside in the black brine, a massive cluster of pulsing bioluminescent indigo tentacles unfurls.

Within the glowing lattice, an enormous, golden iris—the size of an automobile—slowly blinks open, staring directly into Astrid's eyes.

A deep sub-harmonic vibration rattles the screws in the metal deck beneath her boots.

DR. LIND
(paralyzed, whisper)
Dear God... it's looking right through me.`
  },
  {
    id: 'steampunk-fantasy',
    title: 'Barnaby & The Clockwork Aeronauts',
    genre: 'Whimsical Steampunk Animation',
    defaultStyle: 'Pixar and Studio Ghibli inspired 3D animation render, rich brass textures, warm sunset clouds, whimsical inventions, detailed warm lighting',
    description: 'An eccentric young inventor tests his brass wings from a floating windmill city.',
    content: `EXT. FLOATING SKY-MILL ISLAND - SUNSET

Puffy marshmallow clouds drift below floating stone archipelagoes held aloft by humongous spinning wooden propellers.

BARNABY (12), oversized brass goggles perched on his wild curly hair, straps on a backpack adorned with interlocking ticking gears and two magnificent pleated silk gliders.

His clockwork mechanical ferret, SPROCKET, chatters anxiously, tugging on Barnaby's suspenders with tiny copper paws.

BARNABY
Don't be such a pessimist, Sprocket! The wind velocity is exactly twelve knots of pure celestial thermals!

Barnaby cranks a brass hand-lever. The silk wings unfold with a satisfying SNAP!

He takes a running leap off the edge of the wooden jetty!

SPROCKET
(squeaks in terror, covering his eyes)

Barnaby plunges down toward the cloud banks—before catching a warm golden gust. The wings billow, lifting him swooping skyward above flying airships and flocks of mechanical migrating hummingbirds.

Barnaby laughs with unrestrained joy as the sunset casts glorious orange and magenta light across his brass goggles!`
  }
];
