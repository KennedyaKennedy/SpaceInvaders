# SpaceInvaders (RE-CREATION)

A faithful recreation of the classic Space Invaders arcade game built with React, TypeScript, and Vite. Features authentic pixel art graphics, chiptune-inspired sound effects and music, and all the classic gameplay elements.

![SpaceInvaders Screenshot](screenshot.png)

## Features

- **Authentic Gameplay**: Classic Space Invaders mechanics with progressive difficulty
- **Pixel Art Graphics**: Faithful recreation of original alien, player, and UFO sprites
- **Chiptune Audio System**: Procedurally generated music and sound effects inspired by classic arcade games
- **Multiple Levels**: Increasing difficulty with faster alien movement as you progress
- **Sound Effects**: Player shots, alien shots, explosions, UFO appearances, and more
- **Shield System**: Destructible shields that provide tactical cover
- **UFO Bonus**: Random UFO appearances for bonus points
- **Responsive Controls**: Keyboard controls (Arrow Keys/A-D for movement, Space to shoot, P to pause)
- **Scoring System**: Points for different alien types, UFO bonuses, and level progression
- **Lives System**: Multiple lives with game over conditions
- **Pause Functionality**: Pause and resume gameplay

## Technical Implementation

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Basic CSS with Tailwind CSS for utility classes
- **Audio**: Web Audio API for procedural sound generation
- **Graphics**: Canvas 2D rendering for pixel-perfect sprite display
- **State Management**: React hooks (useState, useEffect, useRef, useCallback)

### Audio System Details

The game features a custom `AudioManager` class that generates all sounds and music procedurally using the Web Audio API:

- **Music System**: Three different musical themes (menu, gameplay, intense) with procedurally generated melodies, bass lines, and arpeggios
- **Sound Effects**: 
  - Player shooting (double-tap laser sound)
  - Alien shooting (descending sawtooth wave)
  - Explosions (white noise with envelope)
  - Player death (descending notes)
  - UFO appearance/destruction (special tones)
  - Shield hits (short blips)
  - Marching aliens (alternating tones)

The music dynamically shifts to a more intense theme when fewer aliens remain on screen.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/space-invaders-game-development.git
   cd space-invaders-game-development
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

## How to Play

- **Move Left**: Left Arrow Key or 'A'
- **Move Right**: Right Arrow Key or 'D'
- **Shoot**: Space Bar
- **Pause Game**: 'P' Key
- **Start Game**: Press Space Bar from the title screen
- **Restart After Game Over**: Press Space Bar

## Game Elements

### Aliens
Three types of aliens with different point values:
- **Top Row (Squid)**: 30 points each
- **Middle Rows (Crab)**: 20 points each
- **Bottom Rows (Octopus)**: 10 points each

### UFO
Mystery spaceship that appears randomly for bonus points (50, 100, 150, or 300 points)

### Shields
Four destructible shields that provide temporary cover from alien fire

## Project Structure

```
src/
├── App.tsx          # Main game component with all game logic
├── index.css        # Basic styling
├── main.tsx         # Entry point
└── utils/
    └── cn.ts        # Utility for class name merging
```

## Key Game Constants

Defined in `App.tsx`:
- `GAME_WIDTH`: 640px
- `GAME_HEIGHT`: 480px
- `PLAYER_WIDTH`: 40px
- `PLAYER_HEIGHT`: 20px
- `ALIEN_ROWS`: 5
- `ALIEN_COLS`: 11
- `SHIELD_COUNT`: 4
- Initial lives: 3
- Initial level: 1

## Development

The game uses modern web technologies:
- **React Hooks** for state management and side effects
- **Canvas API** for rendering graphics
- **Web Audio API** for sound generation
- **TypeScript** for type safety
- **Vite** for fast development and building

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- Web Audio API
- ES6+ JavaScript features
- React 19

## Credits

Inspired by the original Space Invaders arcade game released by Taito in 1978.

This is a recreation for educational and entertainment purposes.

## License

This project is open source and available under the MIT License.