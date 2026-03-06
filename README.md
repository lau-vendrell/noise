# Noise Field Particles

Pieza interactiva en Canvas 2D con partículas guiadas por un campo de ruido. Incluye dos modos de control por tabs en panel lateral derecho: manual y voz.

## Ejecutar

```bash
npm install
npm run dev
```

## Modo manual

Selecciona la tab `Manual`.

Controles disponibles:
- `particleCount`
- `speed`
- `noiseScale`
- `noiseStrength`
- `trail`
- `turbulence / octaves`
- `Randomize seed`
- `Pause / Play`
- `Reset`

Los valores se guardan en `localStorage` y se recuperan al recargar la página.

## Modo voz

Selecciona la tab `Voice` y usa:
- `Start microphone`
- `Stop microphone`
- indicador de estado (`mic off`, `listening`, `permission denied`, `error`)
- medidor de entrada (`Input level`)
- ajustes de mapeo (`sensitivity`, `maxParticlesFromVoice`, `voiceToSpeed`, `voiceToNoise`, `noise floor`, `calm decay`)

Comportamiento:
- al entrar en modo voz, el sistema arranca en calma
- con más intensidad sonora, suben movimiento, densidad y fuerza de ruido
- en silencio vuelve de forma progresiva (sin cortes bruscos)

## Permisos de micrófono

El modo voz requiere permiso de micrófono del navegador (`getUserMedia`).

- En local, usa `http://localhost` con `npm run dev`.
- Si el usuario deniega permiso, el estado pasará a `permission denied`.

## Atajos

- `Space`: pause/play
- `R`: reset
- `S`: randomize seed
- `H`: ocultar/mostrar panel
